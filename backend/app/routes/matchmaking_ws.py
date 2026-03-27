from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.match import Match

router = APIRouter()

# joueurs en attente
waiting_players = []


@router.websocket("/ws/matchmaking")
async def websocket_matchmaking(websocket: WebSocket):
    await websocket.accept()

    db: Session = SessionLocal()

    try:
        # recevoir user_id depuis frontend
        user_id = int(await websocket.receive_text())

        user = db.query(User).get(user_id)

        if not user:
            await websocket.close()
            return

        # chercher un joueur proche en ELO
        matched_player = None

        for player in waiting_players:
            other_user = player["user"]

            if abs(other_user.elo - user.elo) <= 100:
                matched_player = player
                break

        # MATCH TROUVÉ
        if matched_player:
            waiting_players.remove(matched_player)

            # 🎮 créer match en DB
            match = Match(
                player1_id=user.id,
                player2_id=matched_player["user"].id,
                status="ongoing"
            )

            db.add(match)
            db.commit()
            db.refresh(match)

            match_data = {
                "type": "match_found",
                "match_id": match.id,
                "players": [user.id, matched_player["user"].id]
            }

            # envoyer aux 2 joueurs
            await websocket.send_json(match_data)
            await matched_player["ws"].send_json(match_data)

        else:
            # ajouter à la queue
            waiting_players.append({
                "ws": websocket,
                "user": user
            })

        # boucle écoute
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        # retirer joueur si déconnecté
        waiting_players[:] = [
            p for p in waiting_players if p["ws"] != websocket
        ]

    finally:
        db.close()