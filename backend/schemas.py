from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional
from datetime import datetime


# ─── Auth ────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Category ────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    slug: str
    image_url: str = ""


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    image_url: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    image_url: str

    class Config:
        from_attributes = True


# ─── Product ────────────────────────────────────────
class ColorSchema(BaseModel):
    name: str
    hex: str


class ProductCreate(BaseModel):
    name: str
    price: float
    original_price: Optional[float] = None
    image_url: str = ""
    images: list[str] = []
    category_id: Optional[int] = None
    sizes: list[str] = []
    colors: list[ColorSchema] = []
    description: str = ""
    tags: list[str] = []
    stock: int = 100


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    image_url: Optional[str] = None
    images: Optional[list[str]] = None
    category_id: Optional[int] = None
    sizes: Optional[list[str]] = None
    colors: Optional[list[ColorSchema]] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    original_price: Optional[float]
    image_url: str
    images: list[str]
    category_id: Optional[int]
    category_name: Optional[str] = None
    sizes: list[str]
    colors: list[dict]
    description: str
    rating: float
    reviews: int
    tags: list[str]
    stock: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Order ───────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    product_name: str = ""
    size: str
    color: str
    quantity: int = 1
    price: float


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    shipping_address: dict = {}
    customer_name: str = ""
    customer_phone: str = ""
    total: float = 0.0
    whatsapp_sent: bool = False


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    size: str
    color: str
    quantity: int
    price: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: Optional[int]
    status: str
    total: float
    shipping_address: dict
    customer_name: str
    customer_phone: str
    whatsapp_sent: bool
    items: list[OrderItemResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str


# ─── Wishlist ────────────────────────────────────────
class WishlistAdd(BaseModel):
    product_id: int


class WishlistResponse(BaseModel):
    id: int
    product_id: int
    product: Optional[ProductResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Chat ────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str = Field(..., min_length=1, max_length=500)


class ChatRequest(BaseModel):
    # Primary input contract.
    message: Optional[str] = Field(default=None, min_length=1, max_length=500)
    # Backward compatibility for existing frontend conversations.
    messages: list[ChatMessage] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_payload(self) -> "ChatRequest":
        if self.message:
            return self
        if any(m.role == "user" and m.content.strip() for m in self.messages):
            return self
        raise ValueError("Provide either 'message' or at least one user message in 'messages'.")


class ChatResponse(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    # Backward compatibility for UI currently reading `reply`.
    reply: str = Field(..., min_length=1, max_length=500)
    product: Optional[str] = None
    color: str
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    # Bonus: include a few example prompts users can try.
    examples: list[str] = Field(default_factory=list)


# ─── Stats ───────────────────────────────────────────
class AdminStats(BaseModel):
    total_products: int
    total_orders: int
    total_users: int
    total_revenue: float
    pending_orders: int
