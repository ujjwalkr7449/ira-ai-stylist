import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.database import SessionLocal
from backend.models import Order

db = SessionLocal()
orders = db.query(Order).order_by(Order.id.desc()).limit(5).all()

for o in orders:
    print(f"Order {o.id}: Phone={o.customer_phone}, Total={o.total}, Created={o.created_at}")
