from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from database import get_db
from models import Order, OrderItem, User, Product, PaymentAttempt, IdempotencyKey
from schemas import OrderCreate, OrderResponse, OrderItemResponse, OrderStatusUpdate, AdminStats
from auth import get_current_user, get_optional_user, require_admin
from services.whatsapp_service import send_whatsapp_order_confirmation

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _order_to_response(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total=order.total,
        shipping_address=order.shipping_address or {},
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        whatsapp_sent=order.whatsapp_sent,
        items=[OrderItemResponse.model_validate(i) for i in order.items],
        created_at=order.created_at,
    )


@router.post("", response_model=OrderResponse)
def create_order(
    req: OrderCreate,
    user=Depends(get_optional_user),
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    if not idempotency_key or not idempotency_key.strip():
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required")
    if len(idempotency_key) > 255:
        raise HTTPException(status_code=400, detail="Idempotency-Key must be 255 characters or fewer")
    if not req.items:
        raise HTTPException(status_code=400, detail="An order must contain at least one item")

    existing_key = db.query(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key).first()
    if existing_key:
        if existing_key.route != "/api/orders":
            raise HTTPException(status_code=409, detail="Idempotency-Key has already been used")
        if existing_key.user_id != (user.id if user else None):
            raise HTTPException(status_code=409, detail="Idempotency-Key has already been used")
        existing_order = db.query(Order).filter(Order.id == existing_key.response_json.get("order_id")).first()
        if existing_order:
            return _order_to_response(existing_order)

    order = Order(
        user_id=user.id if user else None,
        total=0,
        shipping_address=req.shipping_address,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        whatsapp_sent=False,
        status="pending",
    )
    line_items = []
    total = 0.0

    try:
        db.add(order)
        db.flush()

        for item in req.items:
            product = (
                db.query(Product)
                .filter(Product.id == item.product_id, Product.is_active == True)
                .with_for_update()
                .first()
            )
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            product_price = round(float(product.price), 2)
            line_total = round(product_price * item.quantity, 2)
            stock_updated = (
                db.query(Product)
                .filter(
                    Product.id == product.id,
                    Product.is_active == True,
                    Product.stock >= item.quantity,
                )
                .update(
                    {Product.stock: Product.stock - item.quantity},
                    synchronize_session=False,
                )
            )
            if stock_updated != 1:
                raise HTTPException(status_code=409, detail=f"Insufficient stock for {product.name}")
            db.expire(product, ["stock"])
            total = round(total + line_total, 2)
            line_items.append({
                "product_id": product.id,
                "product_name": product.name,
                "size": item.size,
                "color": item.color,
                "quantity": item.quantity,
                "price": product_price,
            })
            db.add(OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                size=item.size,
                color=item.color,
                quantity=item.quantity,
                price=product_price,
            ))

        order.total = total
        db.add(PaymentAttempt(
            order_id=order.id,
            status="initiated",
            provider="manual",
            amount=total,
            attempt_no=1,
        ))
        db.flush()
        db.add(IdempotencyKey(
            route="/api/orders",
            user_id=user.id if user else None,
            key=idempotency_key,
            response_json={"order_id": order.id},
            status_code=201,
        ))
        db.commit()
        db.refresh(order)
    except IntegrityError:
        db.rollback()
        existing_key = db.query(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key).first()
        if (
            existing_key
            and existing_key.route == "/api/orders"
            and existing_key.user_id == (user.id if user else None)
        ):
            existing_order = db.query(Order).filter(Order.id == existing_key.response_json.get("order_id")).first()
            if existing_order:
                return _order_to_response(existing_order)
        raise HTTPException(status_code=409, detail="Could not place this order; please retry")
    except Exception:
        db.rollback()
        raise

    if order.customer_phone:
        try:
            order.whatsapp_sent = bool(send_whatsapp_order_confirmation(
                order.customer_phone,
                {
                    "order_id": order.id,
                    "customer_name": order.customer_name,
                    "total": order.total,
                    "items": line_items,
                },
            ))
            db.commit()
            db.refresh(order)
        except Exception:
            db.rollback()

    return _order_to_response(order)


@router.get("", response_model=list[OrderResponse])
def list_my_orders(user=Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    return [_order_to_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_response(order)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(order_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status in ("shipped", "delivered"):
        raise HTTPException(status_code=400, detail="Shipped or delivered orders cannot be cancelled")
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return _order_to_response(order)


@router.get("/admin/all", response_model=list[OrderResponse])
def list_all_orders(admin=Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [_order_to_response(o) for o in orders]


@router.put("/admin/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, req: OrderStatusUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if req.status not in ("pending", "confirmed", "shipped", "delivered", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")
    order.status = req.status
    db.commit()
    db.refresh(order)
    return _order_to_response(order)


@router.get("/admin/stats", response_model=AdminStats)
def get_admin_stats(admin=Depends(require_admin), db: Session = Depends(get_db)):
    return AdminStats(
        total_products=db.query(Product).count(),
        total_orders=db.query(Order).count(),
        total_users=db.query(User).filter(User.role == "user").count(),
        total_revenue=db.query(func.coalesce(func.sum(Order.total), 0)).scalar(),
        pending_orders=db.query(Order).filter(Order.status == "pending").count(),
    )
