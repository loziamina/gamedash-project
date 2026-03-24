from fastapi import FastAPI
from app.database import Base, engine
from app.models import user
from app.routes import auth
from app.routes import user

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, prefix="/users", tags=["Users"])
@app.get("/")
def root():
    return {"message": "GameDash API running "}

