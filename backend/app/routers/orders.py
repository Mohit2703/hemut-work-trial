from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from datetime import date, datetime, timedelta

from app.database import get_db
from app.models import Order, Stop, Customer
from app.schemas import (
    OrderCreate,
    OrderResponse,
    OrderListResponse,
    OrderListItem,
    OrderStopsUpdate,
    StopResponse,
    CustomerCard,
)
from app.services.geometry import stops_to_linestring, compute_total_miles, enrich_stops_with_coordinates

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_to_response(order: Order) -> OrderResponse:
    """Convert Order model to OrderResponse with stops, route_geometry, and optional customer."""
    stops = [StopResponse.model_validate(s) for s in sorted(order.stops, key=lambda s: s.sequence)]
    customer = None
    if getattr(order, "customer", None) and order.customer:
        customer = CustomerCard.model_validate(order.customer)
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        trailer_type=order.trailer_type,
        load_type=order.load_type,
        weight_lbs=order.weight_lbs,
        notes=order.notes,
        status=order.status,
        route_geometry=order.route_geometry,
        total_miles=order.total_miles,
        stops=stops,
        created_at=order.created_at,
        customer=customer,
    )


def _get_origin_destination(order: Order) -> tuple[str | None, str | None, str | None, str | None]:
    """Get origin city/state and destination city/state from first and last stop."""
    sorted_stops = sorted(order.stops, key=lambda s: s.sequence)
    if not sorted_stops:
        return None, None, None, None
    first = sorted_stops[0]
    last = sorted_stops[-1]
    return (
        first.city,
        first.state,
        last.city,
        last.state,
    )


def _normalize(value: str | None) -> str:
    return (value or "").strip().lower()


def _normalize_equipment(value: str | None) -> str:
    return _normalize(value).replace(" ", "-")


def _matches_location_filter(term: str, city: str | None, state: str | None) -> bool:
    normalized = _normalize(term)
    if not normalized:
        return True
    haystack = " ".join(part for part in [city, state] if part).lower()
    return normalized in haystack


def _matches_time_window_filter(scheduled_at: datetime | None, time_window: str) -> bool:
    normalized = _normalize(time_window)
    if not normalized:
        return True
    if not scheduled_at:
        return False

    hour = scheduled_at.hour
    if normalized == "morning":
        return 5 <= hour < 12
    if normalized == "afternoon":
        return 12 <= hour < 17
    if normalized == "evening":
        return 17 <= hour < 23
    return True


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(body: OrderCreate, db: Session = Depends(get_db)):
    """Create order with stops in a transaction. Sets route_geometry and total_miles."""
    if not body.stops:
        raise HTTPException(status_code=400, detail="At least one stop is required")

    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == body.customer_id).first()
    if not customer:
        raise HTTPException(status_code=400, detail=f"Customer id {body.customer_id} not found")

    sequences = [s.sequence for s in body.stops]
    if len(sequences) != len(set(sequences)):
        raise HTTPException(status_code=400, detail="Stop sequences must be unique per order")

    order = Order(
        customer_id=body.customer_id,
        trailer_type=body.trailer_type,
        load_type=body.load_type,
        weight_lbs=body.weight_lbs,
        notes=body.notes,
        status="draft",
    )
    db.add(order)
    db.flush()

    for s in body.stops:
        stop = Stop(
            order_id=order.id,
            sequence=s.sequence,
            stop_type=s.stop_type,
            location_name=s.location_name,
            address=s.address,
            city=s.city,
            state=s.state,
            zip=s.zip,
            lat=s.lat,
            lng=s.lng,
            scheduled_arrival_early=s.scheduled_arrival_early,
            scheduled_arrival_late=s.scheduled_arrival_late,
        )
        db.add(stop)

    db.flush()

    # Re-fetch stops and compute geometry + total_miles
    stops_for_order = db.query(Stop).filter(Stop.order_id == order.id).order_by(Stop.sequence).all()
    enrich_stops_with_coordinates(stops_for_order)
    db.flush()
    order.route_geometry = stops_to_linestring(stops_for_order)
    order.total_miles = compute_total_miles(stops_for_order)
    db.add(order)
    db.commit()
    db.refresh(order)

    return _order_to_response(order)


@router.get("", response_model=OrderListResponse)
def list_orders(
    q: str = Query("", description="Search by order id, customer name, origin/destination city or state"),
    available_date: date | None = Query(None, description="Filter by origin scheduled arrival date"),
    time_window: str = Query("", description="morning|afternoon|evening"),
    pickup: str = Query("", description="Origin city/state"),
    delivery: str = Query("", description="Destination city/state"),
    equipment: str = Query("", description="flatbed|reefer|dry-van"),
    shipper: str = Query("", description="all|preferred|new"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List orders with search and pagination."""
    query = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.stops))
        .join(Customer, Order.customer_id == Customer.id)
    )
    if q and q.strip():
        term = f"%{q.strip()}%"
        search_filter = or_(
            Customer.name.ilike(term),
            Stop.city.ilike(term),
            Stop.state.ilike(term),
        )
        if q.strip().isdigit():
            search_filter = or_(search_filter, Order.id == int(q.strip()))
        query = query.outerjoin(Stop, Order.id == Stop.order_id).filter(search_filter).distinct()

    orders = query.order_by(Order.id.desc()).all()

    filtered_orders: list[Order] = []
    for order in orders:
        origin_city, origin_state, destination_city, destination_state = _get_origin_destination(order)
        origin_stop = sorted(order.stops, key=lambda s: s.sequence)[0] if order.stops else None
        origin_eta = origin_stop.scheduled_arrival_early if origin_stop else None

        if available_date and (not origin_eta or origin_eta.date() != available_date):
            continue
        if not _matches_time_window_filter(origin_eta, time_window):
            continue
        if not _matches_location_filter(pickup, origin_city, origin_state):
            continue
        if not _matches_location_filter(delivery, destination_city, destination_state):
            continue
        if _normalize_equipment(equipment) not in ("", "all"):
            if _normalize_equipment(order.trailer_type) != _normalize_equipment(equipment):
                continue
        normalized_shipper = _normalize(shipper)
        if normalized_shipper == "preferred":
            if not order.customer or not order.customer.mc_number:
                continue
        if normalized_shipper == "new":
            if not order.created_at:
                continue
            cutoff = (
                datetime.now(order.created_at.tzinfo) - timedelta(days=30)
                if order.created_at.tzinfo
                else datetime.utcnow() - timedelta(days=30)
            )
            if order.created_at < cutoff:
                continue

        filtered_orders.append(order)

    total = len(filtered_orders)
    offset = (page - 1) * page_size
    page_orders = filtered_orders[offset : offset + page_size]

    items = []
    for order in page_orders:
        oc, os, dc, ds = _get_origin_destination(order)
        items.append(
            OrderListItem(
                id=order.id,
                customer_id=order.customer_id,
                customer_name=order.customer.name if order.customer else "",
                trailer_type=order.trailer_type,
                load_type=order.load_type,
                weight_lbs=order.weight_lbs,
                origin_city=oc,
                origin_state=os,
                destination_city=dc,
                destination_state=ds,
                total_miles=order.total_miles,
                status=order.status,
                created_at=order.created_at,
            )
        )

    return OrderListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get single order with stops, route_geometry, and customer. 404 if not found."""
    order = (
        db.query(Order)
        .options(joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_response(order)


@router.put("/{order_id}/stops", response_model=OrderResponse)
def update_order_stops(order_id: int, body: OrderStopsUpdate, db: Session = Depends(get_db)):
    """Replace stops for an order. Recomputes route_geometry and total_miles. 404 if order not found; 400 if validation fails."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not body.stops:
        raise HTTPException(status_code=400, detail="At least one stop is required")

    sequences = [s.sequence for s in body.stops]
    if len(sequences) != len(set(sequences)):
        raise HTTPException(status_code=400, detail="Stop sequences must be unique per order")

    # Delete existing stops and add new ones
    db.query(Stop).filter(Stop.order_id == order_id).delete()
    db.flush()

    for s in body.stops:
        stop = Stop(
            order_id=order_id,
            sequence=s.sequence,
            stop_type=s.stop_type,
            location_name=s.location_name,
            address=s.address,
            city=s.city,
            state=s.state,
            zip=s.zip,
            lat=s.lat,
            lng=s.lng,
            scheduled_arrival_early=s.scheduled_arrival_early,
            scheduled_arrival_late=s.scheduled_arrival_late,
        )
        db.add(stop)

    db.flush()

    stops_for_order = db.query(Stop).filter(Stop.order_id == order_id).order_by(Stop.sequence).all()
    enrich_stops_with_coordinates(stops_for_order)
    db.flush()
    order.route_geometry = stops_to_linestring(stops_for_order)
    order.total_miles = compute_total_miles(stops_for_order)
    db.add(order)
    db.commit()
    db.refresh(order)

    return _order_to_response(order)
