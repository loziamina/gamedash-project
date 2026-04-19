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
    player_status = Column(String, default="online")
    role = Column(String, default="player")
    elo = Column(Integer, default=1000)
    ranked_elo = Column(Integer, default=1000)
    unranked_elo = Column(Integer, default=1000)
    fun_elo = Column(Integer, default=1000)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    soft_currency = Column(Integer, default=0)
    hard_currency = Column(Integer, default=0)
    equipped_avatar_frame = Column(String, nullable=True)
    equipped_title = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
