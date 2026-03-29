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

    alter_statements = {
        "is_active": "ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE",
        "avatar_url": "ALTER TABLE users ADD COLUMN avatar_url TEXT",
        "bio": "ALTER TABLE users ADD COLUMN bio TEXT",
        "region": "ALTER TABLE users ADD COLUMN region VARCHAR",
        "language": "ALTER TABLE users ADD COLUMN language VARCHAR",
        "matchmaking_preferences": "ALTER TABLE users ADD COLUMN matchmaking_preferences TEXT",
        "player_status": "ALTER TABLE users ADD COLUMN player_status VARCHAR NOT NULL DEFAULT 'online'",
        "ranked_elo": "ALTER TABLE users ADD COLUMN ranked_elo INTEGER NOT NULL DEFAULT 1000",
        "unranked_elo": "ALTER TABLE users ADD COLUMN unranked_elo INTEGER NOT NULL DEFAULT 1000",
        "fun_elo": "ALTER TABLE users ADD COLUMN fun_elo INTEGER NOT NULL DEFAULT 1000",
        "xp": "ALTER TABLE users ADD COLUMN xp INTEGER NOT NULL DEFAULT 0",
        "level": "ALTER TABLE users ADD COLUMN level INTEGER NOT NULL DEFAULT 1",
        "soft_currency": "ALTER TABLE users ADD COLUMN soft_currency INTEGER NOT NULL DEFAULT 0",
    }

    with engine.begin() as connection:
        for column_name, statement in alter_statements.items():
            if column_name not in user_columns:
                connection.execute(text(statement))

    if "queue_players" in inspector.get_table_names():
        queue_columns = {column["name"] for column in inspector.get_columns("queue_players")}
        if "mode" not in queue_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE queue_players ADD COLUMN mode VARCHAR NOT NULL DEFAULT 'ranked'")
                )

    if "matches" in inspector.get_table_names():
        match_columns = {column["name"] for column in inspector.get_columns("matches")}
        match_alter_statements = {
            "mode": "ALTER TABLE matches ADD COLUMN mode VARCHAR NOT NULL DEFAULT 'ranked'",
            "finished_at": "ALTER TABLE matches ADD COLUMN finished_at TIMESTAMP NULL",
            "duration_seconds": "ALTER TABLE matches ADD COLUMN duration_seconds INTEGER",
            "player1_elo_change": "ALTER TABLE matches ADD COLUMN player1_elo_change INTEGER NOT NULL DEFAULT 0",
            "player2_elo_change": "ALTER TABLE matches ADD COLUMN player2_elo_change INTEGER NOT NULL DEFAULT 0",
            "player1_xp_gain": "ALTER TABLE matches ADD COLUMN player1_xp_gain INTEGER NOT NULL DEFAULT 0",
            "player2_xp_gain": "ALTER TABLE matches ADD COLUMN player2_xp_gain INTEGER NOT NULL DEFAULT 0",
        }
        with engine.begin() as connection:
            for column_name, statement in match_alter_statements.items():
                if column_name not in match_columns:
                    connection.execute(text(statement))

    if "maps" in inspector.get_table_names():
        map_columns = {column["name"] for column in inspector.get_columns("maps")}
        map_alter_statements = {
            "content_url": "ALTER TABLE maps ADD COLUMN content_url TEXT",
            "screenshot_urls": "ALTER TABLE maps ADD COLUMN screenshot_urls TEXT",
            "tests_count": "ALTER TABLE maps ADD COLUMN tests_count INTEGER NOT NULL DEFAULT 0",
            "retention_score": "ALTER TABLE maps ADD COLUMN retention_score FLOAT NOT NULL DEFAULT 0",
            "featured": "ALTER TABLE maps ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE",
            "hidden": "ALTER TABLE maps ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE",
            "featured_at": "ALTER TABLE maps ADD COLUMN featured_at TIMESTAMP NULL",
            "last_updated_at": "ALTER TABLE maps ADD COLUMN last_updated_at TIMESTAMP NOT NULL DEFAULT NOW()",
            "last_tested_at": "ALTER TABLE maps ADD COLUMN last_tested_at TIMESTAMP NULL",
        }
        with engine.begin() as connection:
            for column_name, statement in map_alter_statements.items():
                if column_name not in map_columns:
                    connection.execute(text(statement))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
