from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    trailer_type = Column(String(64), nullable=True)
    load_type = Column(String(128), nullable=True)
    weight_lbs = Column(Integer, nullable=True)
    notes = Column(String(1024), nullable=True)
    status = Column(String(32), nullable=False, default="draft")
    route_geometry = Column(JSONB, nullable=True)  # GeoJSON LineString: {"type": "LineString", "coordinates": [[lng, lat], ...]}
    total_miles = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    stops = relationship("Stop", back_populates="order", order_by="Stop.sequence", cascade="all, delete-orphan")
