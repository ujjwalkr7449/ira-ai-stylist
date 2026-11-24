import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ira.db")
JWT_SECRET = os.getenv("JWT_SECRET", "ira-fashion-secret-key-change-in-production-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

WHATSAPP_NUMBER = "917979760802"

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886") # Twilio sandbox number

# Open-source model downloaded once and run locally by Diffusers.
LOCAL_IMAGE_MODEL = os.getenv("LOCAL_IMAGE_MODEL", "segmind/tiny-sd")
ENABLE_LOCAL_IMAGE_GENERATION = os.getenv("ENABLE_LOCAL_IMAGE_GENERATION", "true").lower() in {"1", "true", "yes", "on"}
