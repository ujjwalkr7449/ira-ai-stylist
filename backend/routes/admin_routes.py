from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import Product, User, Order
from schemas import UserResponse

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserResponse])
def list_users(admin=Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/inventory/low-stock")
def low_stock_products(admin=Depends(require_admin), db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.stock <= 5, Product.is_active == True).all()
    return [
        {"id": p.id, "name": p.name, "stock": p.stock, "threshold": 5}
        for p in products
    ]


@router.get("/reports/sales")
def sales_report(admin=Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).all()
    gross = sum(o.total for o in orders)
    cancelled = sum(1 for o in orders if o.status == "cancelled")
    delivered = sum(1 for o in orders if o.status == "delivered")
    return {
        "total_orders": len(orders),
        "gross_revenue": round(gross, 2),
        "cancelled_orders": cancelled,
        "delivered_orders": delivered,
    }
