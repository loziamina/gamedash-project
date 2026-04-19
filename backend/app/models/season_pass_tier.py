from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class SeasonPassTier(Base):
    __tablename__ = "season_pass_tiers"

    id = Column(Integer, primary_key=True, index=True)
    tier = Column(Integer, unique=True, index=True, nullable=False)
    xp_required = Column(Integer, default=0)
    free_reward_type = Column(String, default="soft_currency")
    free_reward_amount = Column(Integer, default=0)
    free_reward_sku = Column(String, nullable=True)
    premium_reward_type = Column(String, default="soft_currency")
    premium_reward_amount = Column(Integer, default=0)
    premium_reward_sku = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
