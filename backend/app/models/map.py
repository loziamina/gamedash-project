from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(String)
    author_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
