from __future__ import annotations

import json
import uuid
import base64
from io import BytesIO
from pathlib import Path
import httpx
from PIL import Image
from huggingface_hub import InferenceClient

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from groq import Groq

from schemas import ChatRequest, ChatResponse
from database import get_db
from models import Product
from config import (
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN,
    GROQ_API_KEY,
    GROQ_MODEL,
    HUGGINGFACE_API_KEY,
    IMAGE_GENERATION_PROVIDER,
)

# Read provider configuration from backend/config.py and environment variables.
client = Groq(api_key=GROQ_API_KEY)
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"

CHAT_EXAMPLES = [
    "I am a 16 year old boy",
    "When I'm a 21 year old boy going on a date, what clothes suit me?",
    "Show me a beautiful dress for a summer wedding",
    "I want a professional outfit for a job interview",
]

PRODUCT_SEARCH_TERMS = {
    "shirt": ("shirt", "tee", "t-shirt", "tshirt"),
    "t-shirt": ("shirt", "tee", "t-shirt", "tshirt"),
    "tshirt": ("shirt", "tee", "t-shirt", "tshirt"),
    "tee": ("shirt", "tee", "t-shirt", "tshirt"),
}

router = APIRouter(prefix="/api", tags=["Chat"])

def _save_generated_image(image_bytes: bytes, prefix: str) -> str:
    """Save generated image bytes in the directory served by the uploads route."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{uuid.uuid4().hex}.jpg"
    filepath = UPLOAD_DIR / filename
    with Image.open(BytesIO(image_bytes)) as image:
        image.convert("RGB").save(filepath, format="JPEG", quality=92)
    return f"/api/uploads/{filename}"


def _generate_image(image_prompt: str) -> str:
    """Generate an outfit image with the configured provider and save it locally."""
    full_prompt = f"{image_prompt}, high quality fashion photography, detailed, professional"

    if IMAGE_GENERATION_PROVIDER == "cloudflare":
        if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
            print("Cloudflare image generation is not configured (set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN)")
            return ""
        url = (
            "https://api.cloudflare.com/client/v4/accounts/"
            f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell"
        )
        try:
            response = httpx.post(
                url,
                headers={"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"},
                json={"prompt": full_prompt, "steps": 4},
                timeout=120,
            )
            if response.is_error:
                try:
                    errors = response.json().get("errors", [])
                    detail = "; ".join(error.get("message", "") for error in errors)
                except (ValueError, AttributeError):
                    detail = response.text[:300]
                raise RuntimeError(f"Cloudflare returned HTTP {response.status_code}: {detail or 'request failed'}")
            response.raise_for_status()
            payload = response.json()
            encoded_image = payload.get("result", {}).get("image")
            if not encoded_image:
                raise ValueError("Cloudflare response did not include a generated image")
            image_bytes = base64.b64decode(encoded_image)
            return _save_generated_image(image_bytes, "cf")
        except Exception as e:
            print(f"Cloudflare image generation failed: {e}")
            return ""

    if IMAGE_GENERATION_PROVIDER == "huggingface":
        if not HUGGINGFACE_API_KEY:
            print("Hugging Face image generation is not configured (set HF_TOKEN)")
            return ""
        image_client = InferenceClient(
            model="black-forest-labs/FLUX.1-schnell",
            provider="auto",
            token=HUGGINGFACE_API_KEY,
            timeout=120,
        )
        try:
            image = image_client.text_to_image(full_prompt)
            buffer = BytesIO()
            image.save(buffer, format="PNG")
            return _save_generated_image(buffer.getvalue(), "hf")
        except Exception as e:
            print(f"Hugging Face image generation failed: {e}")
            return ""

    print(f"Unsupported IMAGE_GENERATION_PROVIDER: {IMAGE_GENERATION_PROVIDER}")
    return ""

def _resolve_user_message(req: ChatRequest) -> str:
    """Read direct message input first, fallback to last user message in history."""
    if req.message and req.message.strip():
        return req.message.strip()

    messages_list = []
    # Try getting the last relevant user message
    for msg in reversed(req.messages):
        if msg.role.lower() == "user" and msg.content.strip():
            return msg.content.strip()

    return ""

def _build_system_prompt() -> str:
    return """You are the Ira AI Stylist, a highly capable and intelligent fashion assistant for an e-commerce platform.
Your goal is to provide specific, stylish, and personalized clothing recommendations based on user characteristics like age, gender, and purpose.

You must analyze the user's prompt and generate a recommendation for ONE main clothing outfit or item.

YOU MUST strictly output only raw JSON with the following schema, and no other text:
{
  "reply": "Your conversational and friendly response addressing the user's fashion needs. Provide detailed styling advice.",
  "product": "The main product category word (e.g. 'jacket', 'dress'). Very simple one or two words max.",
  "color": "The primary color of the recommended outfit.",
  "image_prompt": "A SHORT AND CONCISE prompt (maximum 10 words) for an AI image generator (e.g. 'handsome 21yo guy black jacket')."
}
"""

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    """
    Intelligent AI Stylist chatbot endpoint using Groq.
    - Uses LLaMA model to understand age, gender, and purpose.
    - Generates a styled response, product extraction, and image prompt.
    - Uses Pollinations AI to render an actual image.
    """
    user_message = _resolve_user_message(req)
    
    if not user_message:
        message = "Hi! I am your Ira AI Stylist. Tell me your age, gender, and what occasion you're dressing for!"
        return ChatResponse(
            message=message,
            reply=message,
            product=None,
            color="white",
            image_prompt=None,
            image_url=None,
            examples=CHAT_EXAMPLES,
        )

    data = {}
    try:
        # Text generation and image generation are independent; a Groq error
        # should not prevent the Hugging Face image attempt below.
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": _build_system_prompt()},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=500
        )
        
        data = json.loads(completion.choices[0].message.content or "{}")
    except Exception as e:
        print(f"Groq API Error: {e}")

    product = data.get("product") or "outfit"
    color = data.get("color") or "multicolored"
    reply = data.get("reply") or "Here is a stylish option based on your request."
    image_prompt = data.get("image_prompt") or f"{color} fashion outfit for {user_message}"

    # The generated image is attempted regardless of whether Groq succeeded or
    # a matching catalog product exists. Use the catalog image only if HF fails.
    generated_image_url = _generate_image(image_prompt)

    db_product = None
    if product.lower() != "outfit":
        product_terms = PRODUCT_SEARCH_TERMS.get(product.lower(), (product,))
        product_filters = [
            or_(Product.name.ilike(f"%{term}%"), Product.description.ilike(f"%{term}%"))
            for term in product_terms
        ]
        search_query = db.query(Product).filter(Product.is_active == True).filter(
            or_(*product_filters)
        )
        if color.lower() != "multicolored":
            db_product = search_query.filter(
                or_(Product.name.ilike(f"%{color}%"), Product.description.ilike(f"%{color}%"))
            ).first()
        if not db_product:
            db_product = search_query.first()

    product_id = db_product.id if db_product else None
    product_name = db_product.name if db_product else None
    image_url = generated_image_url or (db_product.image_url if db_product else "")
    if db_product:
        reply += f"\n\nI recommend this {db_product.name} from our collection!"

    return ChatResponse(
        message=reply,
        reply=reply,
        product=product,
        product_id=product_id,
        product_name=product_name,
        color=color,
        image_prompt=image_prompt,
        image_url=image_url,
        examples=CHAT_EXAMPLES,
    )


@router.get("/chat/examples")
def chat_examples() -> dict[str, list[dict[str, str]]]:
    """Returns sample scenarios showing the capability of the AI stylist."""
    return {
        "examples": [
            {
                "input": "I am a 16 year old boy",
                "response_message": "For a 16-year-old guy, a laid-back and trendy look is perfect. I recommend a comfortable oversized graphic hoodie paired with jeans.",
            },
            {
                "input": "I am a 21 year old boy going on a date, what fits me?",
                "response_message": "For a date night, a smart-casual approach works best. A sharp black denim jacket over a minimalist white t-shirt gives you a confident and attractive style.",
            },
            {
                "input": "I need a professional outfit for a job interview (woman, 25)",
                "response_message": "A tailored navy blazer matched with a crisp white blouse presents a strong, capable, and professional image for your interview.",
            },
        ]
    }
