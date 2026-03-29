from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class MapReport(Base):
    __tablename__ = "map_reports"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
