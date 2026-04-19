from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    provider = Column(String, nullable=False)
    pack_sku = Column(String, nullable=False)
    amount_cents = Column(Integer, default=0)
    currency = Column(String, default="EUR")
    status = Column(String, default="completed")
    external_ref = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
