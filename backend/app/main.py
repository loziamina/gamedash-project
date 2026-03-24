from fastapi import FastAPI
from app.database import Base, engine

# IMPORT ROUTES
from app.routes import auth
from app.routes import admin

app = FastAPI()

# CREATE TABLES
Base.metadata.create_all(bind=engine)

# ROUTES
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/auth", tags=["Admin"])