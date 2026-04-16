from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Category
from schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from auth import require_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()


@router.get("/{cat_id}", response_model=CategoryResponse)
def get_category(cat_id: int, db: Session = Depends(get_db)):
    c = db.query(Category).filter(Category.id == cat_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    return c


@router.post("", response_model=CategoryResponse)
def create_category(req: CategoryCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(Category).filter(Category.slug == req.slug).first():
        raise HTTPException(status_code=400, detail="Category slug already exists")
    cat = Category(name=req.name, slug=req.slug, image_url=req.image_url)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: int, req: CategoryUpdate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, val in req.model_dump(exclude_unset=True).items():
        setattr(cat, key, val)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}")
def delete_category(cat_id: int, admin=Depends(require_admin), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"ok": True}
