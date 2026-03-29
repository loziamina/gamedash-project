from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base


class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(String)
    author_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="draft")
    content_url = Column(Text, nullable=True)
    screenshot_urls = Column(Text, nullable=True)
    tests_count = Column(Integer, default=0)
    retention_score = Column(Float, default=0)
    featured = Column(Boolean, default=False)
    hidden = Column(Boolean, default=False)
    featured_at = Column(DateTime, nullable=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow)
    last_tested_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
