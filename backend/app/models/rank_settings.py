from sqlalchemy import Column, Integer

from app.database import Base


class RankSettings(Base):
    __tablename__ = "rank_settings"

    id = Column(Integer, primary_key=True, index=True)
    bronze_max = Column(Integer, default=999)
    silver_min = Column(Integer, default=1000)
    gold_min = Column(Integer, default=1200)
    platinum_min = Column(Integer, default=1400)
    diamond_min = Column(Integer, default=1600)
