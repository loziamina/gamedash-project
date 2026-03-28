from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.match import Match
from app.models.user import User

router = APIRouter(prefix="/admin")


def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user


@router.get("/stats")
def admin_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_admin(user)

    return {
        "total_users": db.query(User).count(),
        "total_matches": db.query(Match).count(),
        "active_users": db.query(User).filter(User.is_active.is_(True)).count(),
    }


@router.get("/users")
def get_users(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_admin(user)

    users = db.query(User).all()

    return [
        {
            "id": target.id,
            "email": target.email,
            "role": target.role,
            "elo": target.elo,
            "active": target.is_active,
        }
        for target in users
    ]


@router.post("/ban/{user_id}")
def ban_user(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_admin(user)

    target = db.query(User).filter(User.id == user_id).first()

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = False
    db.commit()

    return {"message": "User banned"}


@router.post("/unban/{user_id}")
def unban_user(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_admin(user)

    target = db.query(User).filter(User.id == user_id).first()

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = True
    db.commit()

    return {"message": "User unbanned"}
