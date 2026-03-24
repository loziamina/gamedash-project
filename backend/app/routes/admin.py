from fastapi import APIRouter, Depends
from app.core.dependencies import require_admin
from app.models.user import User

router = APIRouter()

@router.get("/admin")
def admin_only(user: User = Depends(require_admin)):
    return {"message": f"Welcome admin {user.email}"}