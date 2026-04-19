from sqlalchemy import Boolean, Column, Integer, String, Text

from app.database import Base


class ShopItem(Base):
    __tablename__ = "shop_items"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="cosmetic")
    item_type = Column(String, default="avatar_frame")
    rarity = Column(String, default="rare")
    price_soft = Column(Integer, default=0)
    price_hard = Column(Integer, default=0)
    asset = Column(String, nullable=True)
    season_tier_required = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
