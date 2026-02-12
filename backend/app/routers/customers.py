from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer
from app.schemas import CustomerSearchResponse, CustomerListItem

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerSearchResponse)
def search_customers(
    query: str = Query("", description="Search by name (ILIKE)"),
    db: Session = Depends(get_db),
):
    """Search customers by name (ILIKE)."""
    if not query or not query.strip():
        return CustomerSearchResponse(items=[])

    pattern = f"%{query.strip()}%"
    customers = db.query(Customer).filter(Customer.name.ilike(pattern)).limit(50).all()
    return CustomerSearchResponse(items=[CustomerListItem.model_validate(c) for c in customers])
