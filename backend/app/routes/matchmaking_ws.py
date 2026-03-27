from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

waiting_players = []


@router.websocket("/ws/matchmaking")
async def websocket_matchmaking(websocket: WebSocket):
    await websocket.accept()

    # ajouter joueur
    waiting_players.append(websocket)

    try:
        # si 2 joueurs → match
        if len(waiting_players) >= 2:

            player1 = waiting_players.pop(0)
            player2 = waiting_players.pop(0)

            match_data = {
                "type": "match_found",
                "players": ["player1", "player2"]
            }

            await player1.send_json(match_data)
            await player2.send_json(match_data)

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        if websocket in waiting_players:
            waiting_players.remove(websocket)