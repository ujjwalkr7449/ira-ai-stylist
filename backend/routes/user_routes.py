from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, Address
from schemas import UserResponse, UserProfileUpdate, AddressCreate, AddressUpdate, AddressResponse

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_profile(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
def update_profile(req: UserProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload = req.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/me/addresses", response_model=list[AddressResponse])
def list_addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == user.id).order_by(Address.created_at.desc()).all()


@router.post("/me/addresses", response_model=AddressResponse)
def create_address(req: AddressCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.is_default:
        db.query(Address).filter(Address.user_id == user.id, Address.is_default == True).update({"is_default": False})
    elif db.query(Address).filter(Address.user_id == user.id).count() == 0:
        req.is_default = True

    address = Address(user_id=user.id, **req.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.patch("/me/addresses/{address_id}", response_model=AddressResponse)
def update_address(address_id: int, req: AddressUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    payload = req.model_dump(exclude_unset=True)
    if payload.get("is_default") is True:
        db.query(Address).filter(Address.user_id == user.id, Address.is_default == True).update({"is_default": False})

    for key, value in payload.items():
        setattr(address, key, value)

    db.commit()
    db.refresh(address)
    return address


@router.delete("/me/addresses/{address_id}")
def delete_address(address_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    was_default = address.is_default
    db.delete(address)
    db.commit()

    if was_default:
        fallback = db.query(Address).filter(Address.user_id == user.id).first()
        if fallback:
            fallback.is_default = True
            db.commit()

    return {"ok": True}
