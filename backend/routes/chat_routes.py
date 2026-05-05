from __future__ import annotations

import json
import os
import uuid
import requests
from urllib.parse import quote_plus
from huggingface_hub import InferenceClient

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from groq import Groq

from schemas import ChatRequest, ChatResponse
from database import get_db
from models import Product

# The user explicitly provided the key, but we'll use an environment variable as primary
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
client = Groq(api_key=GROQ_API_KEY)

CHAT_EXAMPLES = [
    "I am a 16 year old boy",
    "When I'm a 21 year old boy going on a date, what clothes suit me?",
    "Show me a beautiful dress for a summer wedding",
    "I want a professional outfit for a job interview",
]

router = APIRouter(prefix="/api", tags=["Chat"])

def _generate_huggingface_image(image_prompt: str) -> str:
    """Generate a realistic AI outfit image using Hugging Face and save locally."""
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not api_key:
        print("Warning: HUGGINGFACE_API_KEY not set")
        return ""

    # Ensure uploads directory exists
    if not os.path.exists("uploads"):
        os.makedirs("uploads")

    client = InferenceClient("black-forest-labs/FLUX.1-schnell", token=api_key)
    
    # Improve the prompt for better fashion results
    full_prompt = f"{image_prompt}, high quality fashion photography, detailed, professional"
    
    try:
        # Generate the image
        image = client.text_to_image(full_prompt)
        
        # Save it
        filename = f"hf_{uuid.uuid4().hex}.jpg"
        filepath = os.path.join("uploads", filename)
        image.save(filepath)
        
        return f"/api/uploads/{filename}"
    except Exception as e:
        print(f"Exception calling HF API: {e}")
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

    try:
        # Call Groq API in JSON mode
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": _build_system_prompt()},
                {"role": "user", "content": user_message}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=500
        )
        
        response_content = completion.choices[0].message.content
        data = json.loads(response_content)
        
        reply = data.get("reply", "Here is a stylish option for you!")
        product = data.get("product", "outfit")
        color = data.get("color", "multicolored")
        image_prompt = data.get("image_prompt", f"A stylish {color} {product}")
        
        # Try to find a real product in the database first
        db_product = None
        if product and product.lower() != "outfit":
            # Very simple search based on name or description matching the product and color keywords
            search_query = db.query(Product).filter(Product.is_active == True)
            search_query = search_query.filter(
                or_(
                    Product.name.ilike(f"%{product}%"),
                    Product.description.ilike(f"%{product}%")
                )
            )
            # Try to match color if provided
            if color and color.lower() != "multicolored":
                color_query = search_query.filter(
                    or_(
                        Product.name.ilike(f"%{color}%"),
                        Product.description.ilike(f"%{color}%")
                    )
                )
                db_product = color_query.first()
            
            if not db_product:
                db_product = search_query.first()

        product_id = None
        product_name = None

        if db_product and db_product.image_url:
            image_url = db_product.image_url
            product_id = db_product.id
            product_name = db_product.name
            # Slightly modify the reply to mention we found a real match
            reply += f"\n\nI recommend this {db_product.name} from our collection!"
        else:
            # Build HF image dynamically as fallback
            image_url = _generate_huggingface_image(image_prompt)
        
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
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        # Graceful fallback if Groq API fails or JSON is malformed
        fallback_msg = "I'm having a little trouble thinking of the perfect outfit right now, but a classic white shirt never goes wrong!"
        return ChatResponse(
            message=fallback_msg,
            reply=fallback_msg,
            product="shirt",
            color="white",
            image_prompt="A classic plain white shirt, fashion photography",
            image_url="",
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
