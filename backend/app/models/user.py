from sqlalchemy import Boolean, Column, Integer, String
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    pseudo = Column(String)
    role = Column(String, default="player")
    elo = Column(Integer, default=1000)
    is_active = Column(Boolean, default=True)
