from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Product, Category
from schemas import ProductCreate, ProductUpdate, ProductResponse, StyleScanResponse
from auth import require_admin

router = APIRouter(prefix="/api/products", tags=["Products"])

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _product_to_response(p: Product) -> ProductResponse:
    return ProductResponse(
        id=p.id,
        name=p.name,
        price=p.price,
        original_price=p.original_price,
        image_url=p.image_url,
        images=p.images or [],
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        sizes=p.sizes or [],
        colors=p.colors or [],
        description=p.description,
        rating=p.rating,
        reviews=p.reviews,
        tags=p.tags or [],
        stock=p.stock,
        is_active=p.is_active,
        created_at=p.created_at,
    )


def _infer_product_title(description: str) -> str:
    lowered = description.lower()
    if "dress" in lowered:
        return "AI Curated Dress"
    if "shirt" in lowered:
        return "AI Curated Shirt"
    if "jean" in lowered or "denim" in lowered:
        return "AI Curated Denim"
    if "jacket" in lowered:
        return "AI Curated Jacket"
    return "AI Curated Fashion Item"


def _infer_category_slug(description: str) -> str:
    lowered = description.lower()
    if any(word in lowered for word in ["woman", "women", "female", "her"]):
        return "women"
    if any(word in lowered for word in ["street", "oversized", "urban", "hoodie"]):
        return "streetwear"
    if any(word in lowered for word in ["formal", "office", "blazer", "wedding"]):
        return "formal"
    return "men"


def _infer_tags(description: str) -> list[str]:
    lowered = description.lower()
    tags: list[str] = []
    mapping = {
        "summer": ["breathable", "summer-ready"],
        "winter": ["layering", "winter-essential"],
        "party": ["party", "statement"],
        "casual": ["everyday", "casual"],
        "ethnic": ["ethnic", "festive"],
        "work": ["office", "smart-style"],
    }
    for key, values in mapping.items():
        if key in lowered:
            tags.extend(values)
    if not tags:
        tags = ["trending", "ai-styled"]
    return list(dict.fromkeys(tags))


@router.post("/upload-image")
async def upload_product_image(
    request: Request,
    image: UploadFile = File(...),
    admin=Depends(require_admin),
):
    suffix = Path(image.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Only JPG, PNG and WEBP files are allowed")

    file_name = f"{uuid4().hex}{suffix}"
    target = UPLOAD_DIR / file_name
    content = await image.read()
    target.write_bytes(content)

    return {"url": str(request.url_for("uploads", path=file_name))}


@router.post("/style-scan", response_model=StyleScanResponse)
async def style_scan(
    request: Request,
    image: UploadFile = File(...),
    description: str = Form(""),
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    upload_data = await upload_product_image(request=request, image=image, admin=admin)
    text = description.strip() or "modern smart casual clothing"

    category_slug = _infer_category_slug(text)
    category = db.query(Category).filter(Category.slug == category_slug).first()

    return StyleScanResponse(
        suggested_name=_infer_product_title(text),
        suggested_description=(
            f"{text.capitalize()}. AI style scan suggests a premium fit, modern silhouette, and flexible day-to-night styling."
        ),
        suggested_category_id=category.id if category else None,
        suggested_tags=_infer_tags(text),
        suggested_sizes=["S", "M", "L", "XL"],
        suggested_colors=[
            {"name": "Black", "hex": "#111111"},
            {"name": "Ivory", "hex": "#F5F5EB"},
        ],
        uploaded_image_url=upload_data["url"],
    )


@router.get("", response_model=list[ProductResponse])
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Product).filter(Product.is_active == True)
    if category:
        cat = db.query(Category).filter(Category.slug == category).first()
        if cat:
            q = q.filter(Product.category_id == cat.id)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    products = q.order_by(Product.created_at.desc()).all()
    return [_product_to_response(p) for p in products]


@router.get("/all", response_model=list[ProductResponse])
def list_all_products(admin=Depends(require_admin), db: Session = Depends(get_db)):
    """Admin: list all products including inactive"""
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return [_product_to_response(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_to_response(p)


@router.post("", response_model=ProductResponse)
def create_product(req: ProductCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    product = Product(
        name=req.name,
        price=req.price,
        original_price=req.original_price,
        image_url=req.image_url,
        images=req.images,
        category_id=req.category_id,
        sizes=req.sizes,
        colors=[c.model_dump() for c in req.colors],
        description=req.description,
        tags=req.tags,
        stock=req.stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return _product_to_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, req: ProductUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    update_data = req.model_dump(exclude_unset=True)
    if "colors" in update_data and update_data["colors"] is not None:
        update_data["colors"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in update_data["colors"]]
    for key, val in update_data.items():
        setattr(product, key, val)
    db.commit()
    db.refresh(product)
    return _product_to_response(product)


@router.delete("/{product_id}")
def delete_product(product_id: int, admin=Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"ok": True}
