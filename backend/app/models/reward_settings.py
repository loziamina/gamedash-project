from sqlalchemy import Column, Integer

from app.database import Base


class RewardSettings(Base):
    __tablename__ = "reward_settings"

    id = Column(Integer, primary_key=True, index=True)
    win_xp = Column(Integer, default=35)
    loss_xp = Column(Integer, default=18)
    win_currency = Column(Integer, default=20)
    loss_currency = Column(Integer, default=10)
    daily_quest_bonus_xp = Column(Integer, default=30)
    weekly_quest_bonus_xp = Column(Integer, default=120)
