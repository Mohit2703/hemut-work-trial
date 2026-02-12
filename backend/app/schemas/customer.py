from pydantic import BaseModel, ConfigDict


class CustomerListItem(BaseModel):
    id: int
    name: str
    mc_number: str | None = None
    city: str | None = None
    state: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomerCard(BaseModel):
    """Customer info for order detail (drawer)."""
    id: int
    name: str
    mc_number: str | None = None
    city: str | None = None
    state: str | None = None
    phone: str | None = None
    email: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomerSearchResponse(BaseModel):
    items: list["CustomerListItem"]
