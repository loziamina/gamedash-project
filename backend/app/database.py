from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Charger les variables .env
load_dotenv()

# Récupérer DATABASE_URL depuis .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Debug (à enlever après)
print("DB URL =", DATABASE_URL)

# Création engine (avec encodage UTF-8 pour éviter ton erreur)
engine = create_engine(
    DATABASE_URL,
    echo=True,  # optionnel (logs SQL)
    pool_pre_ping=True,
    connect_args={"options": "-c client_encoding=utf8"}
)

# Session DB
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base pour les modèles
Base = declarative_base()

# Dépendance FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()