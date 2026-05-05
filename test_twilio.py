import sys
import os
from dotenv import load_dotenv

# Add backend directory to path so we can import services
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
from backend.services.whatsapp_service import send_whatsapp_order_confirmation

print(f"SID: {TWILIO_ACCOUNT_SID}")
print(f"Auth Token: {TWILIO_AUTH_TOKEN[:5]}...")
print(f"From: {TWILIO_WHATSAPP_NUMBER}")

order_dict = {
    "order_id": 999,
    "customer_name": "Test User",
    "total": 100.0,
    "items": [{"product_name": "Test Product", "size": "M", "color": "Red", "quantity": 1, "price": 100.0}]
}

# Use the number the user provided earlier
phone = "+916201598182"
print(f"Sending test to {phone}...")

result = send_whatsapp_order_confirmation(phone, order_dict)
print(f"Result: {result}")
