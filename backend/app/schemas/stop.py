from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class StopCreate(BaseModel):
    stop_type: str  # pickup, stop, dropoff
    location_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    scheduled_arrival_early: Optional[datetime] = None
    scheduled_arrival_late: Optional[datetime] = None
    sequence: int


class StopUpdate(StopCreate):
    id: Optional[int] = None  # for existing stops


class StopResponse(BaseModel):
    id: int
    order_id: int
    stop_type: str
    location_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    scheduled_arrival_early: Optional[datetime] = None
    scheduled_arrival_late: Optional[datetime] = None
    sequence: int

    model_config = ConfigDict(from_attributes=True)
