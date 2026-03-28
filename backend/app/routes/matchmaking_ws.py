import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import jwt, JWTError

from app.database import SessionLocal
from app.models.user import User
from app.config import SECRET_KEY

router = APIRouter()

# connexions actives
active_connections = []


@router.websocket("/ws/matchmaking")
async def matchmaking_ws(websocket: WebSocket):
    await websocket.accept()

    #  récupérer token depuis URL
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close()
        return

    try:
        #  decode JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()

        if not user:
            await websocket.close()
            return

    except JWTError:
        await websocket.close()
        return

    #  ajouter utilisateur connecté
    active_connections.append(websocket)

    try:
        while True:
            #  nombre réel de joueurs connectés
            await websocket.send_json({
                "type": "stats",
                "players": len(active_connections)
            })

            #  elo réel user
            await websocket.send_json({
                "type": "elo",
                "elo": user.elo
            })

            await asyncio.sleep(2)

    except WebSocketDisconnect:
        active_connections.remove(websocket)