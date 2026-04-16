import httpx
from fastapi import APIRouter, HTTPException
from schemas import ChatRequest, ChatResponse
from config import GROQ_API_KEY, GROQ_MODEL, GROQ_API_URL
from database import SessionLocal
from models import Product

router = APIRouter(prefix="/api/chat", tags=["Chat"])


def _get_product_catalog() -> str:
    db = SessionLocal()
    try:
        products = db.query(Product).filter(Product.is_active == True).all()
        lines = []
        for p in products:
            colors = ", ".join([c["name"] for c in (p.colors or [])]) or "N/A"
            sizes = ", ".join(p.sizes or []) or "N/A"
            lines.append(f"- {p.name} (₹{p.price}, Category: {p.category.name if p.category else 'N/A'}, Colors: {colors}, Sizes: {sizes})")
        return "\n".join(lines) if lines else "No products available."
    finally:
        db.close()


SYSTEM_PROMPT_TEMPLATE = """You are IRA AI Stylist — a premium fashion consultant for IRA Clothing, an AI-driven fashion brand.

Your job is to help customers find the perfect outfit from IRA's catalog. You should:
1. Listen to their mood, occasion, or style preference
2. Suggest specific products from the catalog below
3. Explain why the combination works
4. Be friendly, trendy, and enthusiastic (use emojis sparingly)
5. Keep responses concise (max 3-4 sentences)
6. Use **bold** for product names

IRA Product Catalog:
{catalog}

If they ask about something not in the catalog, suggest the closest match. Always stay in character as a fashion stylist."""


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    catalog = _get_product_catalog()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(catalog=catalog)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend([{"role": m.role, "content": m.content} for m in req.messages])

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                GROQ_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 300,
                },
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"AI service error: {resp.status_code}")
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return ChatResponse(reply=reply)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
