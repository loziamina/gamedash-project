from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.match import Match

router = APIRouter()


# 📊 stats globales
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):

    total_users = db.query(User).count()
    total_matches = db.query(Match).count()

    finished_matches = db.query(Match).filter(Match.status == "finished").count()

    return {
        "total_users": total_users,
        "total_matches": total_matches,
        "finished_matches": finished_matches
    }


# 📈 distribution ELO
@router.get("/elo-distribution")
def elo_distribution(db: Session = Depends(get_db)):

    players = db.query(User.elo).all()

    elos = [p[0] for p in players]

    return {
        "elos": elos,
        "min": min(elos) if elos else 0,
        "max": max(elos) if elos else 0,
        "avg": sum(elos) / len(elos) if elos else 0
    }


# 🏆 winrate d’un joueur
@router.get("/winrate/{user_id}")
def winrate(user_id: int, db: Session = Depends(get_db)):

    total = db.query(Match).filter(
        (Match.player1_id == user_id) |
        (Match.player2_id == user_id),
        Match.status == "finished"
    ).count()

    wins = db.query(Match).filter(
        Match.winner_id == user_id
    ).count()

    winrate = (wins / total * 100) if total > 0 else 0

    return {
        "user_id": user_id,
        "wins": wins,
        "total_matches": total,
        "winrate": round(winrate, 2)
    }