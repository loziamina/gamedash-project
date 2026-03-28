from fastapi import WebSocket, APIRouter, WebSocketDisconnect
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import SECRET_KEY
from app.core.ws_manager import manager
from app.database import SessionLocal
from app.models.user import User
from app.utils.rank import get_rank

router = APIRouter()


@router.websocket("/ws/matchmaking")
async def websocket_endpoint(websocket: WebSocket):

    token = websocket.query_params.get("token")

    if not token:
        await websocket.close()
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("sub")

    except JWTError:
        await websocket.close()
        return

    db: Session = SessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()
    finally:
        db.close()

    if not user:
        await websocket.close()
        return

    await manager.connect(user.id, websocket)

    #  ENVOI INITIAL DASHBOARD
    total_users = len(manager.active_connections)
    await websocket.send_json({
        "type": "stats",
        "players": total_users
    })

    await websocket.send_json({
        "type": "elo",
        "elo": user.elo,
        "rank": get_rank(user.elo)
    })

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(user.id)
