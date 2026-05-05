import requests

payload = {
  "items": [
    {
      "product_id": 1,
      "product_name": "Test Shirt",
      "size": "L",
      "color": "Blue",
      "quantity": 1,
      "price": 500.0
    }
  ],
  "shipping_address": {
    "address1": "123 Test St",
    "city": "Testville",
    "state": "TS",
    "pin": "12345"
  },
  "customer_name": "Test Customer",
  "customer_phone": "6201598182",
  "total": 500.0,
  "whatsapp_sent": True
}

try:
    response = requests.post("http://127.0.0.1:8000/api/orders", json=payload)
    print(f"Status: {response.status_code}")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")

# check log
import os
if os.path.exists("backend/twilio_log.txt"):
    with open("backend/twilio_log.txt", "r") as f:
        print("\n--- twilio log ---")
        print(f.read())
