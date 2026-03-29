from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer

from app.database import Base


class MapPlaytest(Base):
    __tablename__ = "map_playtests"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    duration_seconds = Column(Integer, default=300)
    completion_rate = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
