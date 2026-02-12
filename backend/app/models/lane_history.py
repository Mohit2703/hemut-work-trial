from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base


class LaneHistory(Base):
    """Stub for enhancement C: lane history stats (avg rate, last load, frequency)."""
    __tablename__ = "lane_history"

    id = Column(Integer, primary_key=True, index=True)
    origin_city = Column(String(128), nullable=True)
    origin_state = Column(String(32), nullable=True)
    destination_city = Column(String(128), nullable=True)
    destination_state = Column(String(32), nullable=True)
    avg_rate_per_mile = Column(Float, nullable=True)
    total_loads = Column(Integer, nullable=True)
    last_load_at = Column(DateTime(timezone=True), nullable=True)
    frequency_label = Column(String(64), nullable=True)  # e.g. "Weekly"
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
