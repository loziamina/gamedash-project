from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class EconomySettings(Base):
    __tablename__ = "economy_settings"

    id = Column(Integer, primary_key=True, index=True)
    starter_soft_currency = Column(Integer, default=0)
    starter_hard_currency = Column(Integer, default=0)
    season_name = Column(String, default="")
    season_ends_at = Column(DateTime, nullable=True)
    season_tier_xp = Column(Integer, default=0)
    premium_pass_price_hard = Column(Integer, default=0)
    stripe_enabled = Column(Boolean, default=False)
    paypal_enabled = Column(Boolean, default=False)
