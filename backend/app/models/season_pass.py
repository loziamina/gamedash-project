from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.database import Base


class SeasonPass(Base):
    __tablename__ = "season_passes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    season_name = Column(String, nullable=False)
    premium_unlocked = Column(Boolean, default=False)
    claimed_free_tiers = Column(Text, default="")
    claimed_premium_tiers = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
