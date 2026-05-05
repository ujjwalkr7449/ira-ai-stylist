import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.database import SessionLocal
from backend.models import Order
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# connect directly to backend/ira.db
engine = create_engine("sqlite:///backend/ira.db")
Session = sessionmaker(bind=engine)
db = Session()

try:
    orders = db.query(Order).order_by(Order.id.desc()).limit(5).all()
    if not orders:
        print("No orders found in database!")
    for o in orders:
        print(f"Order {o.id}: Phone={o.customer_phone}, Total={o.total}, Created={o.created_at}")
except Exception as e:
    print(f"Error: {e}")
