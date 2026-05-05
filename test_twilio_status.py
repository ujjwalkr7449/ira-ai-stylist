import sys
import os
import time
from twilio.rest import Client
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

message = client.messages.create(
    from_=TWILIO_WHATSAPP_NUMBER,
    body="Test message to check status",
    to="whatsapp:+916201598182"
)

print(f"Message SID: {message.sid}")
print(f"Initial Status: {message.status}")

# Wait a few seconds for delivery attempt
time.sleep(3)

# Fetch updated status
updated_message = client.messages(message.sid).fetch()
print(f"Updated Status: {updated_message.status}")
print(f"Error Message: {updated_message.error_message}")
print(f"Error Code: {updated_message.error_code}")
