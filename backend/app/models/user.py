from sqlalchemy import Boolean, Column, Integer, String, Text

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    pseudo = Column(String)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    region = Column(String, nullable=True)
    language = Column(String, nullable=True)
    matchmaking_preferences = Column(Text, nullable=True)
    role = Column(String, default="player")
    elo = Column(Integer, default=1000)
    is_active = Column(Boolean, default=True)
