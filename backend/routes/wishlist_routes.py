from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Wishlist, Product
from schemas import WishlistAdd, ProductResponse
from auth import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


@router.get("", response_model=list[int])
def get_wishlist(user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Return list of product IDs in user's wishlist"""
    items = db.query(Wishlist.product_id).filter(Wishlist.user_id == user.id).all()
    return [i[0] for i in items]


@router.post("")
def add_to_wishlist(req: WishlistAdd, user=Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(Wishlist).filter(Wishlist.user_id == user.id, Wishlist.product_id == req.product_id).first()
    if exists:
        return {"ok": True, "action": "already_exists"}
    item = Wishlist(user_id=user.id, product_id=req.product_id)
    db.add(item)
    db.commit()
    return {"ok": True, "action": "added"}


@router.delete("/{product_id}")
def remove_from_wishlist(product_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Wishlist).filter(Wishlist.user_id == user.id, Wishlist.product_id == product_id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"ok": True, "action": "removed"}


@router.post("/toggle")
def toggle_wishlist(req: WishlistAdd, user=Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(Wishlist).filter(Wishlist.user_id == user.id, Wishlist.product_id == req.product_id).first()
    if exists:
        db.delete(exists)
        db.commit()
        return {"ok": True, "action": "removed"}
    item = Wishlist(user_id=user.id, product_id=req.product_id)
    db.add(item)
    db.commit()
    return {"ok": True, "action": "added"}
