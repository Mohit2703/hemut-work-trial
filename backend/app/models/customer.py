from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    mc_number = Column(String(64), nullable=True)
    dot_number = Column(String(64), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=True)
    state = Column(String(32), nullable=True)
    zip = Column(String(32), nullable=True)
    phone = Column(String(64), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    orders = relationship("Order", back_populates="customer")
