from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class VirtualTransaction(Base):
    __tablename__ = "virtual_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Integer, default=0)
    currency_type = Column(String, default="soft")
    source = Column(String, default="match_reward")
    created_at = Column(DateTime, default=datetime.utcnow)
