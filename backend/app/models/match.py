from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("users.id"))
    player2_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)