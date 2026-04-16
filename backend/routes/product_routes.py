from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Product, Category
from schemas import ProductCreate, ProductUpdate, ProductResponse
from auth import require_admin

router = APIRouter(prefix="/api/products", tags=["Products"])


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
