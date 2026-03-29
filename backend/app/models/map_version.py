from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class MapVersion(Base):
    __tablename__ = "map_versions"

    id = Column(Integer, primary_key=True)
    map_id = Column(Integer, ForeignKey("maps.id"))
    version = Column(String)
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
