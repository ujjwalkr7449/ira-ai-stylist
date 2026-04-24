from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, Cart, CartItem, Product
from schemas import CartItemAdd, CartItemUpdate, CartResponse, CartItemResponse

router = APIRouter(prefix="/api/cart", tags=["Cart"])


def _get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if cart:
        return cart
    cart = Cart(user_id=user_id)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def _cart_response(cart: Cart) -> CartResponse:
    rows: list[CartItemResponse] = []
    subtotal = 0.0
    for item in cart.items:
        if not item.product or not item.product.is_active:
            continue
        line = item.product.price * item.quantity
        subtotal += line
        rows.append(
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                size=item.size,
                color=item.color,
                product_name=item.product.name,
                product_price=item.product.price,
                product_image=item.product.image_url,
                stock=item.product.stock,
            )
        )
    return CartResponse(items=rows, subtotal=round(subtotal, 2))


@router.get("", response_model=CartResponse)
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = _get_or_create_cart(db, user.id)
    db.refresh(cart)
    return _cart_response(cart)


@router.post("/items", response_model=CartResponse)
def add_cart_item(req: CartItemAdd, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == req.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = _get_or_create_cart(db, user.id)
    existing = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == req.product_id,
            CartItem.size == req.size,
            CartItem.color == req.color,
        )
        .first()
    )

    new_qty = req.quantity + (existing.quantity if existing else 0)
    if new_qty > product.stock:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")

    if existing:
        existing.quantity = new_qty
    else:
        db.add(CartItem(cart_id=cart.id, product_id=req.product_id, quantity=req.quantity, size=req.size, color=req.color))

    cart.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cart)
    return _cart_response(cart)


@router.patch("/items/{item_id}", response_model=CartResponse)
def update_cart_item(item_id: int, req: CartItemUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = _get_or_create_cart(db, user.id)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if req.quantity > item.product.stock:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")
    item.quantity = req.quantity
    cart.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cart)
    return _cart_response(cart)


@router.delete("/items/{item_id}", response_model=CartResponse)
def delete_cart_item(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = _get_or_create_cart(db, user.id)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    cart.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cart)
    return _cart_response(cart)
