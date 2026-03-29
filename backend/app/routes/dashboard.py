from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.match import Match
from app.models.rank_settings import RankSettings
from app.models.user import User
from app.utils.progression import xp_needed_for_level
from app.utils.rank import get_rank_payload

router = APIRouter()

ALLOWED_MODES = {"ranked", "unranked", "fun"}


def get_rank_settings(db: Session):
    return db.query(RankSettings).first()


def get_mode_elo(user: User, mode: str):
    return {
        "ranked": user.ranked_elo,
        "unranked": user.unranked_elo,
        "fun": user.fun_elo,
    }.get(mode, user.ranked_elo)


def get_mode_rank_distribution(users, rank_settings):
    distribution = {}
    for user in users:
        label = get_rank_payload(user.ranked_elo, rank_settings)["label"]
        distribution[label] = distribution.get(label, 0) + 1
    return distribution


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_matches = db.query(Match).count()
    finished_matches = db.query(Match).filter(Match.status == "finished").count()
    matches_last_7_days = (
        db.query(Match)
        .filter(Match.created_at >= datetime.utcnow() - timedelta(days=7))
        .count()
    )

    return {
        "total_users": total_users,
        "total_matches": total_matches,
        "finished_matches": finished_matches,
        "matches_last_7_days": matches_last_7_days,
    }


@router.get("/elo-distribution")
def elo_distribution(db: Session = Depends(get_db)):
    players = db.query(User).all()
    elos = [player.ranked_elo for player in players]
    rank_settings = get_rank_settings(db)

    return {
        "elos": elos,
        "min": min(elos) if elos else 0,
        "max": max(elos) if elos else 0,
        "avg": sum(elos) / len(elos) if elos else 0,
        "rank_distribution": get_mode_rank_distribution(players, rank_settings),
    }


@router.get("/winrate/{user_id}")
def winrate(user_id: int, mode: str | None = Query(default=None), db: Session = Depends(get_db)):
    filters = [or_(Match.player1_id == user_id, Match.player2_id == user_id), Match.status == "finished"]
    if mode in ALLOWED_MODES:
        filters.append(Match.mode == mode)

    total = db.query(Match).filter(*filters).count()
    wins = db.query(Match).filter(Match.winner_id == user_id, *(filters[1:])).count()
    losses = max(total - wins, 0)
    winrate_value = (wins / total * 100) if total > 0 else 0

    return {
        "user_id": user_id,
        "wins": wins,
        "losses": losses,
        "total_matches": total,
        "winrate": round(winrate_value, 2),
        "mode": mode or "all",
    }


@router.get("/leaderboard")
def leaderboard(mode: str = Query(default="ranked"), limit: int = Query(default=10), db: Session = Depends(get_db)):
    mode = mode if mode in ALLOWED_MODES else "ranked"
    users = db.query(User).filter(User.is_active.is_(True)).all()
    rank_settings = get_rank_settings(db)

    sorted_users = sorted(users, key=lambda player: get_mode_elo(player, mode), reverse=True)[:limit]

    return [
        {
            "id": user.id,
            "pseudo": user.pseudo,
            "elo": get_mode_elo(user, mode),
            "rank": get_rank_payload(get_mode_elo(user, mode), rank_settings)["label"],
            "level": user.level,
        }
        for user in sorted_users
    ]


@router.get("/rank-distribution")
def rank_distribution(db: Session = Depends(get_db)):
    users = db.query(User).all()
    rank_settings = get_rank_settings(db)
    return {
        "distribution": get_mode_rank_distribution(users, rank_settings),
    }


@router.get("/me/summary")
def me_summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rank_settings = get_rank_settings(db)
    finished_matches = (
        db.query(Match)
        .filter(or_(Match.player1_id == user.id, Match.player2_id == user.id), Match.status == "finished")
        .all()
    )
    wins = len([match for match in finished_matches if match.winner_id == user.id])
    losses = max(len(finished_matches) - wins, 0)
    total_xp_gained = sum(
        match.player1_xp_gain if match.player1_id == user.id else match.player2_xp_gain
        for match in finished_matches
    )

    return {
        "level": user.level,
        "xp": user.xp,
        "xp_needed_for_next_level": xp_needed_for_level(user.level),
        "soft_currency": user.soft_currency,
        "wins": wins,
        "losses": losses,
        "winrate": round((wins / len(finished_matches) * 100), 2) if finished_matches else 0,
        "total_xp_gained": total_xp_gained,
        "ranked_rank": get_rank_payload(user.ranked_elo, rank_settings)["label"],
        "mmr_by_mode": {
            "ranked": user.ranked_elo,
            "unranked": user.unranked_elo,
            "fun": user.fun_elo,
        },
    }


@router.get("/quests/me")
def my_quests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.utcnow() - timedelta(days=1)
    week = datetime.utcnow() - timedelta(days=7)

    daily_matches = (
        db.query(Match)
        .filter(or_(Match.player1_id == user.id, Match.player2_id == user.id), Match.created_at >= today)
        .count()
    )
    weekly_matches = (
        db.query(Match)
        .filter(or_(Match.player1_id == user.id, Match.player2_id == user.id), Match.created_at >= week)
        .count()
    )
    daily_wins = (
        db.query(Match)
        .filter(Match.winner_id == user.id, Match.created_at >= today)
        .count()
    )

    quests = [
        {
            "id": "daily_play_3",
            "label": "Jouer 3 matchs aujourd'hui",
            "type": "daily",
            "progress": min(daily_matches, 3),
            "target": 3,
            "reward_xp": 30,
            "reward_currency": 20,
            "completed": daily_matches >= 3,
        },
        {
            "id": "daily_win_1",
            "label": "Gagner 1 match aujourd'hui",
            "type": "daily",
            "progress": min(daily_wins, 1),
            "target": 1,
            "reward_xp": 40,
            "reward_currency": 30,
            "completed": daily_wins >= 1,
        },
        {
            "id": "weekly_play_10",
            "label": "Jouer 10 matchs cette semaine",
            "type": "weekly",
            "progress": min(weekly_matches, 10),
            "target": 10,
            "reward_xp": 120,
            "reward_currency": 80,
            "completed": weekly_matches >= 10,
        },
    ]

    return {"quests": quests}
