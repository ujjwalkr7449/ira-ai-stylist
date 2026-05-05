from datetime import datetime
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user, require_admin
from database import get_db
from models import (
    User,
    Product,
    Order,
    OrderItem,
    Cart,
    CartItem,
    Coupon,
    CouponRedemption,
    PaymentAttempt,
    IdempotencyKey,
)
from services.whatsapp_service import send_whatsapp_order_confirmation
from schemas import (
    CheckoutQuoteRequest,
    CheckoutQuoteResponse,
    OrderCreate,
    OrderResponse,
    OrderItemResponse,
    CouponCreate,
    CouponResponse,
)

router = APIRouter(tags=["Checkout"])


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


def _calculate_totals(db: Session, user: User, items: list, coupon_code: str | None):
    line_items = []
    subtotal = 0.0

    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        if item.quantity > product.stock:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        line_total = product.price * item.quantity
        subtotal += line_total
        line_items.append(
            {
                "product_id": product.id,
                "product_name": product.name,
                "price": product.price,
                "quantity": item.quantity,
                "size": item.size,
                "color": item.color,
                "line_total": round(line_total, 2),
            }
        )

    discount = 0.0
    coupon = None
    if coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == coupon_code.upper(), Coupon.is_active == True).first()
        if not coupon:
            raise HTTPException(status_code=400, detail="Invalid coupon")
        if subtotal < coupon.min_order_amount:
            raise HTTPException(status_code=400, detail="Coupon minimum order amount not met")
        if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")

        user_uses = db.query(CouponRedemption).filter(CouponRedemption.coupon_id == coupon.id, CouponRedemption.user_id == user.id).count()
        if coupon.per_user_limit is not None and user_uses >= coupon.per_user_limit:
            raise HTTPException(status_code=400, detail="Coupon per-user limit reached")

        if coupon.discount_type == "percent":
            discount = subtotal * (coupon.value / 100.0)
        else:
            discount = coupon.value
        if coupon.max_discount is not None:
            discount = min(discount, coupon.max_discount)

    discount = min(discount, subtotal)
    total = subtotal - discount
    return {
        "line_items": line_items,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "total": round(total, 2),
        "coupon": coupon,
    }


@router.post("/api/checkout/quote", response_model=CheckoutQuoteResponse)
def checkout_quote(req: CheckoutQuoteRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    calc = _calculate_totals(db, user, req.items, req.coupon_code)
    return CheckoutQuoteResponse(
        subtotal=calc["subtotal"],
        discount=calc["discount"],
        total=calc["total"],
        coupon_code=req.coupon_code,
        line_items=calc["line_items"],
    )


@router.post("/api/checkout/place-order", response_model=OrderResponse)
def place_order(
    req: OrderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required")

    existing_key = db.query(IdempotencyKey).filter(IdempotencyKey.key == idempotency_key).first()
    if existing_key:
        existing_order_id = existing_key.response_json.get("order_id")
        order = db.query(Order).filter(Order.id == existing_order_id).first()
        if order:
            return _order_to_response(order)

    calc = _calculate_totals(db, user, req.items, req.coupon_code)

    order = Order(
        user_id=user.id,
        total=calc["total"],
        shipping_address=req.shipping_address,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        whatsapp_sent=req.whatsapp_sent,
        status="pending",
    )
    db.add(order)
    db.flush()

    for line in calc["line_items"]:
        product = db.query(Product).filter(Product.id == line["product_id"]).with_for_update().first()
        if not product or product.stock < line["quantity"]:
            raise HTTPException(status_code=409, detail=f"Out of stock for product {line['product_name']}")
        product.stock -= line["quantity"]
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=line["product_id"],
                product_name=line["product_name"],
                size=line["size"],
                color=line["color"],
                quantity=line["quantity"],
                price=line["price"],
            )
        )

    if calc["coupon"]:
        calc["coupon"].used_count += 1
        db.add(CouponRedemption(coupon_id=calc["coupon"].id, user_id=user.id, order_id=order.id))

    db.add(
        PaymentAttempt(
            order_id=order.id,
            status="initiated",
            provider="manual",
            amount=calc["total"],
            attempt_no=1,
        )
    )

    cart = db.query(Cart).filter(Cart.user_id == user.id).first()
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        cart.updated_at = datetime.utcnow()

    db.flush()
    db.add(
        IdempotencyKey(
            route="/api/checkout/place-order",
            user_id=user.id,
            key=idempotency_key,
            response_json={"order_id": order.id},
            status_code=201,
        )
    )

    db.commit()
    db.refresh(order)
    
    order_dict = {
        "order_id": order.id,
        "customer_name": order.customer_name,
        "total": order.total,
        "items": calc["line_items"]
    }
    # Fire and forget or handle asynchronously in production.
    # For now, we call it synchronously.
    if order.customer_phone:
        send_whatsapp_order_confirmation(order.customer_phone, order_dict)
    
    return _order_to_response(order)


@router.post("/api/payments/{order_id}/verify")
def verify_payment(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    attempt = (
        db.query(PaymentAttempt)
        .filter(PaymentAttempt.order_id == order_id)
        .order_by(PaymentAttempt.attempt_no.desc())
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Payment attempt not found")
    attempt.status = "verified"
    order.status = "confirmed"
    db.commit()
    return {"ok": True, "order_status": order.status, "payment_status": attempt.status}


@router.post("/api/payments/{order_id}/retry")
def retry_payment(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    latest = (
        db.query(PaymentAttempt)
        .filter(PaymentAttempt.order_id == order_id)
        .order_by(PaymentAttempt.attempt_no.desc())
        .first()
    )
    attempt_no = 1 if not latest else latest.attempt_no + 1
    db.add(PaymentAttempt(order_id=order.id, status="initiated", provider="manual", amount=order.total, attempt_no=attempt_no))
    db.commit()
    return {"ok": True, "attempt_no": attempt_no}


@router.post("/api/admin/coupons", response_model=CouponResponse)
def create_coupon(req: CouponCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    code = req.code.strip().upper()
    existing = db.query(Coupon).filter(Coupon.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon = Coupon(code=code, **req.model_dump(exclude={"code"}))
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.get("/api/admin/coupons", response_model=list[CouponResponse])
def list_coupons(admin=Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()
