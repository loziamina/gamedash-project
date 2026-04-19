from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    item_sku = Column(String, index=True, nullable=False)
    item_type = Column(String, default="avatar_frame")
    source_type = Column(String, default="shop_purchase")
    source_ref = Column(String, nullable=True)
    equipped = Column(Boolean, default=False)
    acquired_at = Column(DateTime, default=datetime.utcnow)
