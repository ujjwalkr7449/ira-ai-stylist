from __future__ import annotations

import re
from urllib.parse import quote_plus

from fastapi import APIRouter

from schemas import ChatRequest, ChatResponse

# Basic NLP dictionaries (simple and explicit by design)
SUPPORTED_COLORS = {
    "white",
    "black",
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "gray",
    "grey",  # alias normalized to gray
    "beige",
    "navy",
}

SUPPORTED_PRODUCTS = {
    "shoe": "shoes",
    "shoes": "shoes",
    "sneaker": "sneakers",
    "sneakers": "sneakers",
    "shirt": "shirt",
    "tshirt": "t-shirt",
    "t-shirt": "t-shirt",
    "hoodie": "hoodie",
    "jacket": "jacket",
    "jeans": "jeans",
    "dress": "dress",
    "bag": "bag",
    "watch": "watch",
    "cap": "cap",
}

CHAT_EXAMPLES = [
    "show me red shoes",
    "i want a black hoodie",
    "find me a blue shirt",
]

router = APIRouter(prefix="/api", tags=["Chat"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _normalize_text(text: str) -> str:
    """Lowercase and remove punctuation so matching stays predictable."""
    cleaned = re.sub(r"[^a-zA-Z0-9\s-]", " ", text.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def _extract_color(normalized_text: str) -> str:
    """Detect first color mention. If absent, default to white."""
    tokens = normalized_text.split()
    for token in tokens:
        if token in SUPPORTED_COLORS:
            return "gray" if token == "grey" else token
    return "white"


def _extract_product(normalized_text: str) -> str | None:
    """Detect first supported product mention."""
    tokens = normalized_text.split()
    for token in tokens:
        if token in SUPPORTED_PRODUCTS:
            return SUPPORTED_PRODUCTS[token]

    # Tiny phrase fallback to catch words glued around punctuation/hyphens.
    for raw, normalized in SUPPORTED_PRODUCTS.items():
        if raw in normalized_text:
            return normalized

    return None


def _build_image_prompt(color: str, product: str) -> str:
    return (
        f"A high-quality ecommerce product image of {color} {product}, "
        "clean background, studio lighting"
    )


def _build_placeholder_image_url(color: str, product: str) -> str:
    # Placeholder image service with readable overlay text.
    label = quote_plus(f"{color} {product}")
    return f"https://placehold.co/600x600/png?text={label}"


def _resolve_user_message(req: ChatRequest) -> str:
    """Read direct message input first, fallback to last user message in history."""
    if req.message and req.message.strip():
        return req.message.strip()

    for msg in reversed(req.messages):
        if msg.role.lower() == "user" and msg.content.strip():
            return msg.content.strip()

    return ""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """
    Simple e-commerce chatbot endpoint.
    - Extracts product + color via string matching.
    - Defaults color to white.
    - Asks for clarification when product is not detected.
    """
    user_message = _resolve_user_message(req)
    normalized_text = _normalize_text(user_message)

    product = _extract_product(normalized_text)
    color = _extract_color(normalized_text)

    if not product:
        message = "Got it — which product are you looking for? (e.g., shoes, shirt, hoodie)"
        return ChatResponse(
            message=message,
            reply=message,
            product=None,
            color=color,
            image_prompt=None,
            image_url=None,
            examples=CHAT_EXAMPLES,
        )

    image_prompt = _build_image_prompt(color=color, product=product)
    image_url = _build_placeholder_image_url(color=color, product=product)
    message = f"Sure — here is a {color} {product} option."

    return ChatResponse(
        message=message,
        reply=message,
        product=product,
        color=color,
        image_prompt=image_prompt,
        image_url=image_url,
        examples=CHAT_EXAMPLES,
    )


@router.get("/chat/examples")
def chat_examples() -> dict[str, list[dict[str, str]]]:
    """Small set of sample requests/responses for quick manual testing."""
    return {
        "examples": [
            {
                "input": "show me red shoes",
                "response_message": "Sure — here is a red shoes option.",
            },
            {
                "input": "i want a hoodie",
                "response_message": "Sure — here is a white hoodie option.",
            },
            {
                "input": "show me something nice",
                "response_message": "Got it — which product are you looking for? (e.g., shoes, shirt, hoodie)",
            },
        ]
    }
