from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.match import Match
from app.models.matchmaking_settings import MatchmakingSettings
from app.models.queue import QueuePlayer
from app.models.rank_settings import RankSettings
from app.models.user import User

router = APIRouter(prefix="/admin")


class MatchmakingSettingsPayload(BaseModel):
    max_elo_gap: int
    max_wait_seconds: int
    team_size: int
    ranked_enabled: bool
    unranked_enabled: bool
    fun_enabled: bool


class RankSettingsPayload(BaseModel):
    silver_min: int
    gold_min: int
    platinum_min: int
    diamond_min: int


def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user


def get_or_create_settings(db: Session) -> MatchmakingSettings:
    settings = db.query(MatchmakingSettings).first()

    if not settings:
        settings = MatchmakingSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


def serialize_settings(settings: MatchmakingSettings):
    return {
        "max_elo_gap": settings.max_elo_gap,
        "max_wait_seconds": settings.max_wait_seconds,
        "team_size": settings.team_size,
        "ranked_enabled": settings.ranked_enabled,
        "unranked_enabled": settings.unranked_enabled,
        "fun_enabled": settings.fun_enabled,
    }


def get_or_create_rank_settings(db: Session) -> RankSettings:
    settings = db.query(RankSettings).first()

    if not settings:
        settings = RankSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


def serialize_rank_settings(settings: RankSettings):
    return {
        "silver_min": settings.silver_min,
        "gold_min": settings.gold_min,
        "platinum_min": settings.platinum_min,
        "diamond_min": settings.diamond_min,
    }


@router.get("/stats")
def admin_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(user)

    return {
        "total_users": db.query(User).count(),
        "total_matches": db.query(Match).count(),
        "active_users": db.query(User).filter(User.is_active.is_(True)).count(),
        "players_online": db.query(User).filter(User.player_status == "online").count(),
        "players_in_queue": db.query(User).filter(User.player_status == "queue").count(),
        "players_in_game": db.query(User).filter(User.player_status == "in_game").count(),
    }


@router.get("/users")
def get_users(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
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
            "player_status": target.player_status,
        }
        for target in users
    ]


@router.get("/matchmaking-settings")
def get_matchmaking_settings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(user)
    return serialize_settings(get_or_create_settings(db))


@router.get("/rank-settings")
def get_rank_settings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(user)
    return serialize_rank_settings(get_or_create_rank_settings(db))


@router.put("/rank-settings")
def update_rank_settings(
    payload: RankSettingsPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(user)
    settings = get_or_create_rank_settings(db)
    settings.silver_min = payload.silver_min
    settings.gold_min = max(payload.gold_min, payload.silver_min + 1)
    settings.platinum_min = max(payload.platinum_min, settings.gold_min + 1)
    settings.diamond_min = max(payload.diamond_min, settings.platinum_min + 1)
    settings.bronze_max = settings.silver_min - 1
    db.commit()
    db.refresh(settings)
    return serialize_rank_settings(settings)


@router.put("/matchmaking-settings")
def update_matchmaking_settings(
    payload: MatchmakingSettingsPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(user)

    settings = get_or_create_settings(db)
    settings.max_elo_gap = max(0, payload.max_elo_gap)
    settings.max_wait_seconds = max(5, payload.max_wait_seconds)
    settings.team_size = max(1, payload.team_size)
    settings.ranked_enabled = payload.ranked_enabled
    settings.unranked_enabled = payload.unranked_enabled
    settings.fun_enabled = payload.fun_enabled

    db.commit()
    db.refresh(settings)

    return serialize_settings(settings)


@router.get("/matchmaking-overview")
def get_matchmaking_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(user)

    queue_players = (
        db.query(QueuePlayer)
        .filter(QueuePlayer.status == "waiting")
        .order_by(QueuePlayer.joined_at.asc())
        .all()
    )

    by_mode = {"ranked": [], "unranked": [], "fun": []}

    for queue_player in queue_players:
        player = db.query(User).filter(User.id == queue_player.user_id).first()
        by_mode.setdefault(queue_player.mode, []).append(
            {
                "user_id": queue_player.user_id,
                "pseudo": player.pseudo if player else f"Player {queue_player.user_id}",
                "elo": player.elo if player else 0,
                "mode": queue_player.mode,
                "joined_at": queue_player.joined_at,
            }
        )

    return {
        "settings": serialize_settings(get_or_create_settings(db)),
        "queue": by_mode,
    }


@router.post("/ban/{user_id}")
def ban_user(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
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
    db: Session = Depends(get_db),
):
    require_admin(user)

    target = db.query(User).filter(User.id == user_id).first()

    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = True
    db.commit()

    return {"message": "User unbanned"}
