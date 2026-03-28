from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.queue import QueuePlayer
from app.models.match import Match
from app.core.ws_manager import manager

router = APIRouter()


@router.get("/history")
def get_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    matches = db.query(Match).filter(
        or_(Match.player1_id == user.id, Match.player2_id == user.id)
    ).order_by(Match.created_at.desc()).all()

    result = []

    for match in matches:
        result.append({
            "match_id": match.id,
            "player1": match.player1_id,
            "player2": match.player2_id,
            "winner": match.winner_id,
            "status": match.status,
            "date": match.created_at
        })

    return result


# JOIN QUEUE
@router.post("/join")
async def join_queue(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    existing = db.query(QueuePlayer).filter(
        QueuePlayer.user_id == user.id,
        QueuePlayer.status == "waiting"
    ).first()

    if existing:
        return {"message": "Already in queue"}

    player = QueuePlayer(user_id=user.id)
    db.add(player)
    db.commit()

    # CHECK MATCH DIRECT
    players = db.query(QueuePlayer).filter(
        QueuePlayer.status == "waiting"
    ).all()

    if len(players) >= 2:

        best_pair = None
        best_diff = 999999

        for i in range(len(players)):
            for j in range(i + 1, len(players)):

                u1 = db.query(User).get(players[i].user_id)
                u2 = db.query(User).get(players[j].user_id)

                diff = abs(u1.elo - u2.elo)

                if diff < best_diff:
                    best_diff = diff
                    best_pair = (players[i], players[j])

        if best_pair:
            p1, p2 = best_pair

            match = Match(
                player1_id=p1.user_id,
                player2_id=p2.user_id
            )

            db.add(match)

            p1.status = "matched"
            p2.status = "matched"

            db.commit()

            #  ENVOI WS AUX 2 USERS
            await manager.send_to_user(p1.user_id, {
                "type": "match_found",
                "opponent": p2.user_id
            })

            await manager.send_to_user(p2.user_id, {
                "type": "match_found",
                "opponent": p1.user_id
            })

            return {"message": "Match auto created"}

    return {"message": "Joined queue"}

# LEAVE QUEUE
@router.post("/leave")
def leave_queue(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    player = db.query(QueuePlayer).filter(
        QueuePlayer.user_id == user.id,
        QueuePlayer.status == "waiting"
    ).first()

    if not player:
        return {"message": "Not in queue"}

    db.delete(player)
    db.commit()

    return {"message": "Left queue"}


# CREATE MATCH

@router.post("/match")
def create_match(db: Session = Depends(get_db)):

    players = db.query(QueuePlayer).filter(
        QueuePlayer.status == "waiting"
    ).all()

    if len(players) < 2:
        return {"message": "Not enough players"}

    best_pair = None
    best_diff = 999999

    for i in range(len(players)):
        for j in range(i + 1, len(players)):

            p1 = players[i]
            p2 = players[j]

            user1 = db.query(User).get(p1.user_id)
            user2 = db.query(User).get(p2.user_id)

            diff = abs(user1.elo - user2.elo)

            if diff < best_diff:
                best_diff = diff
                best_pair = (p1, p2)

    if not best_pair:
        return {"message": "No match found"}

    p1, p2 = best_pair

    match = Match(
        player1_id=p1.user_id,
        player2_id=p2.user_id
    )

    db.add(match)

    p1.status = "matched"
    p2.status = "matched"

    db.commit()

    return {
        "message": "Match created (ELO)",
        "players": [p1.user_id, p2.user_id],
        "elo_diff": best_diff
    }
    
@router.post("/result")
def match_result(
    match_id: int,
    winner_id: int,
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        return {"message": "Match not found"}

    # déterminer loser
    if match.player1_id == winner_id:
        loser_id = match.player2_id
    elif match.player2_id == winner_id:
        loser_id = match.player1_id
    else:
        return {"message": "Invalid winner"}

    winner = db.query(User).get(winner_id)
    loser = db.query(User).get(loser_id)

    # update elo
    expected = 1 / (1 + 10 ** ((loser.elo - winner.elo) / 400))
    winner.elo += int(32 * (1 - expected))
    loser.elo -= int(32 * expected)

    db.commit()

    return {
        "message": "ELO updated",
        "winner": winner_id,
        "loser": loser_id,
        "winner_elo": winner.elo,
        "loser_elo": loser.elo
    }
    
@router.post("/finish")
def finish_match(
    match_id: int,
    winner_id: int,
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        return {"message": "Match not found"}

    match.status = "finished"
    match.winner_id = winner_id

    db.commit()

    return {
        "message": "Match finished",
        "match_id": match.id,
        "winner": winner_id
    }
