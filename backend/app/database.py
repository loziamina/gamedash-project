import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("DB URL =", DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    connect_args={"options": "-c client_encoding=utf8"},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def ensure_schema():
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}

    if "is_active" not in user_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE")
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
