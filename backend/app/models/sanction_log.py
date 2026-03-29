from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class SanctionLog(Base):
    __tablename__ = "sanction_logs"

    id = Column(Integer, primary_key=True, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id"))
    actor_user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    reason = Column(String, default="admin_action")
    created_at = Column(DateTime, default=datetime.utcnow)
