from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from datetime import datetime
from app.database import Base

class QueuePlayer(Base):
    __tablename__ = "queue_players"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mode = Column(String, default="ranked")
    joined_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="waiting")  # waiting / matched
