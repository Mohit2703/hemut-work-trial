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
    """List customers, optionally filtered by name (ILIKE)."""
    customer_query = db.query(Customer)
    if query and query.strip():
        pattern = f"%{query.strip()}%"
        customer_query = customer_query.filter(Customer.name.ilike(pattern))

    customers = customer_query.order_by(Customer.name.asc()).limit(100).all()
    return CustomerSearchResponse(items=[CustomerListItem.model_validate(c) for c in customers])
