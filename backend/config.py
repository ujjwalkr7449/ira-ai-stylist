import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ira.db")
JWT_SECRET = os.getenv("JWT_SECRET", "ira-fashion-secret-key-change-in-production-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

WHATSAPP_NUMBER = "917979760802"
