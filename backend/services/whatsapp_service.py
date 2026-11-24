import logging
from twilio.rest import Client
from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER

logger = logging.getLogger(__name__)

def send_whatsapp_order_confirmation(phone_number: str, order_details: dict):
    """
    Sends a WhatsApp message using Twilio to confirm an order.
    phone_number should be in E.164 format (e.g., +917979760802).
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not set; WhatsApp confirmation was not sent.")
        return False

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        # Build message body
        items_text = ""
        for idx, item in enumerate(order_details.get("items", [])):
            items_text += f"{idx + 1}. {item['product_name']}\n"
            items_text += f"   Size: {item['size']} | Color: {item['color']} | Qty: {item['quantity']}\n"
            items_text += f"   Price: ₹{item['price']:,.2f}\n"

        message_body = (
            f"🛍️ *Order Confirmation from IRA Fashion*\n\n"
            f"Hi {order_details.get('customer_name')},\n\n"
            f"Your order #{order_details.get('order_id')} has been successfully placed!\n\n"
            f"*Order Details:*\n{items_text}\n"
            f"*Total:* ₹{order_details.get('total'):,.2f}\n\n"
            f"Thank you for shopping with us! 🙏"
        )

        # Format phone number for Twilio WhatsApp
        # Ensure it has 'whatsapp:' prefix and starts with '+'
        to_number = phone_number
        if not to_number.startswith('+'):
            # Assuming Indian number if no country code provided and length is 10
            if len(to_number) == 10:
                to_number = f"+91{to_number}"
            else:
                to_number = f"+{to_number}"
                
        to_whatsapp = f"whatsapp:{to_number}"

        message = client.messages.create(
            from_=TWILIO_WHATSAPP_NUMBER,
            body=message_body,
            to=to_whatsapp
        )
        
        logger.info(f"WhatsApp message sent successfully. SID: {message.sid}")
        with open("twilio_log.txt", "a") as f:
            f.write(f"SUCCESS: {message.sid} to {to_whatsapp}\n")
        return True
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message via Twilio: {str(e)}")
        with open("twilio_log.txt", "a") as f:
            f.write(f"ERROR: {str(e)}\n")
        return False
