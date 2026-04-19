from datetime import datetime, timedelta

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class EconomySettings(Base):
    __tablename__ = "economy_settings"

    id = Column(Integer, primary_key=True, index=True)
    starter_soft_currency = Column(Integer, default=250)
    starter_hard_currency = Column(Integer, default=25)
    season_name = Column(String, default="Saison Neon Uprising")
    season_ends_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=45))
    season_tier_xp = Column(Integer, default=120)
    premium_pass_price_hard = Column(Integer, default=15)
    stripe_enabled = Column(Boolean, default=True)
    paypal_enabled = Column(Boolean, default=True)
