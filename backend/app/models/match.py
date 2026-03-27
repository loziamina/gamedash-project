from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from datetime import datetime
from app.database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("users.id"))
    player2_id = Column(Integer, ForeignKey("users.id"))

    status = Column(String, default="pending")  # pending / ongoing / finished
    winner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)