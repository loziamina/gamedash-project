from fastapi import FastAPI
from app.database import Base, engine
from app.routes import auth
from app.routes import user
from app.routes import admin
from app.routes import matchmaking
from app.routes import matchmaking_ws
from app.routes import dashboard
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/auth", tags=["Admin"])
app.include_router(user.router, prefix="/users", tags=["Users"])
app.include_router(matchmaking.router, prefix="/matchmaking", tags=["Matchmaking"])
app.include_router(matchmaking_ws.router, tags=["Matchmaking WS"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
@app.get("/")
def root():
    return {"message": "GameDash API running "}

