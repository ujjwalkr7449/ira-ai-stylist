from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Order, OrderItem, User, Product
from schemas import OrderCreate, OrderResponse, OrderItemResponse, OrderStatusUpdate, AdminStats
from auth import get_current_user, get_optional_user, require_admin

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
def create_order(req: OrderCreate, user=Depends(get_optional_user), db: Session = Depends(get_db)):
    order = Order(
        user_id=user.id if user else None,
        total=req.total,
        shipping_address=req.shipping_address,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        whatsapp_sent=req.whatsapp_sent,
        status="pending",
    )
    db.add(order)
    db.flush()

    for item in req.items:
        oi = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            size=item.size,
            color=item.color,
            quantity=item.quantity,
            price=item.price,
        )
        db.add(oi)

    db.commit()
    db.refresh(order)
    return _order_to_response(order)


@router.get("", response_model=list[OrderResponse])
def list_my_orders(user=Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    return [_order_to_response(o) for o in orders]


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
