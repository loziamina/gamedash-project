from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User

router = APIRouter()

waiting_players = []


@router.websocket("/ws/matchmaking")
async def websocket_matchmaking(websocket: WebSocket):
    await websocket.accept()

    db: Session = SessionLocal()

    try:
        # recevoir user_id
        user_id = int(await websocket.receive_text())

        user = db.query(User).get(user_id)

        if not user:
            await websocket.close()
            return

        # chercher match proche ELO
        matched = None

        for player in waiting_players:
            other_user = player["user"]

            if abs(other_user.elo - user.elo) <= 100:
                matched = player
                break

        if matched:
            waiting_players.remove(matched)

            match_data = {
                "type": "match_found",
                "players": [user.id, matched["user"].id]
            }

            await websocket.send_json(match_data)
            await matched["ws"].send_json(match_data)

        else:
            waiting_players.append({
                "ws": websocket,
                "user": user
            })

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        waiting_players[:] = [
            p for p in waiting_players if p["ws"] != websocket
        ]