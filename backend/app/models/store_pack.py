from sqlalchemy import Boolean, Column, Integer, String, Text

from app.database import Base


class StorePack(Base):
    __tablename__ = "store_packs"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    soft_currency = Column(Integer, default=0)
    hard_currency = Column(Integer, default=0)
    bonus_percent = Column(Integer, default=0)
    price_cents = Column(Integer, default=499)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
