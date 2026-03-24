from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user, require_admin

router = APIRouter()


# GET CURRENT USER
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# GET ALL USERS (ADMIN ONLY)
@router.get("/")
def get_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    users = db.query(User).all()
    return users


# UPDATE USER (USER HIMSELF OR ADMIN)
@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # sécurité : user lui-même OU admin
    if current_user.id != user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    for key, value in data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user


# DELETE USER (ADMIN ONLY)
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # sécurité
    if current_user.id != user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}