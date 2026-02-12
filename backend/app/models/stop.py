from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Stop(Base):
    __tablename__ = "stops"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence = Column(Integer, nullable=False)
    stop_type = Column(String(32), nullable=False)  # pickup, stop, dropoff
    location_name = Column(String(255), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=True)
    state = Column(String(32), nullable=True)
    zip = Column(String(32), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    scheduled_arrival_early = Column(DateTime(timezone=True), nullable=True)
    scheduled_arrival_late = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order = relationship("Order", back_populates="stops")

    __table_args__ = (UniqueConstraint("order_id", "sequence", name="uq_stops_order_id_sequence"),)
