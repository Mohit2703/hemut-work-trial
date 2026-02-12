from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.stop import StopCreate, StopResponse, StopUpdate


class OrderCreate(BaseModel):
    customer_id: int
    trailer_type: Optional[str] = None
    load_type: Optional[str] = None
    weight_lbs: Optional[int] = None
    notes: Optional[str] = None
    stops: list[StopCreate]


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    trailer_type: Optional[str] = None
    load_type: Optional[str] = None
    weight_lbs: Optional[int] = None
    notes: Optional[str] = None
    status: str
    route_geometry: Optional[dict[str, Any]] = None
    stops: list[StopResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderListItem(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    trailer_type: Optional[str] = None
    load_type: Optional[str] = None
    weight_lbs: Optional[int] = None
    origin_city: Optional[str] = None
    origin_state: Optional[str] = None
    destination_city: Optional[str] = None
    destination_state: Optional[str] = None
    total_miles: Optional[float] = None
    status: str
    created_at: datetime


class OrderListResponse(BaseModel):
    items: list[OrderListItem]
    total: int
    page: int
    page_size: int


class OrderStopsUpdate(BaseModel):
    stops: list[StopUpdate]  # optional id for existing stops
