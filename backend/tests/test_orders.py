from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Customer, Order, Stop


client = TestClient(app)


def _cleanup_test_rows() -> None:
    db = SessionLocal()
    try:
        test_customers = db.query(Customer).filter(Customer.name.like("TEST_%")).all()
        test_customer_ids = [c.id for c in test_customers]
        if test_customer_ids:
            test_orders = db.query(Order).filter(Order.customer_id.in_(test_customer_ids)).all()
            test_order_ids = [o.id for o in test_orders]
            if test_order_ids:
                db.query(Stop).filter(Stop.order_id.in_(test_order_ids)).delete(synchronize_session=False)
                db.query(Order).filter(Order.id.in_(test_order_ids)).delete(synchronize_session=False)
            db.query(Customer).filter(Customer.id.in_(test_customer_ids)).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def _ensure_test_customer() -> Customer:
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.name == "TEST_Customer").first()
        if customer:
            return customer
        customer = Customer(
            name="TEST_Customer",
            mc_number="MC-TEST",
            city="TestCity",
            state="TS",
            phone="555-0000",
            email="test@example.com",
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
    finally:
        db.close()


def test_create_order_returns_geometry_and_stops():
    _cleanup_test_rows()
    customer = _ensure_test_customer()

    payload = {
        "customer_id": customer.id,
        "trailer_type": "Dry Van",
        "load_type": "Test Freight",
        "weight_lbs": 1000,
        "notes": "test",
        "stops": [
            {
                "stop_type": "pickup",
                "location_name": "A",
                "city": "A City",
                "state": "AA",
                "lat": 40.0,
                "lng": -80.0,
                "sequence": 1,
            },
            {
                "stop_type": "dropoff",
                "location_name": "B",
                "city": "B City",
                "state": "BB",
                "lat": 41.0,
                "lng": -81.0,
                "sequence": 2,
            },
        ],
    }

    res = client.post("/orders", json=payload)
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["customer_id"] == customer.id
    assert len(body["stops"]) == 2
    assert body["route_geometry"]["type"] == "LineString"
    assert len(body["route_geometry"]["coordinates"]) == 2


def test_list_orders_search_by_customer():
    _cleanup_test_rows()
    customer = _ensure_test_customer()

    # Create one order
    res = client.post(
        "/orders",
        json={
            "customer_id": customer.id,
            "trailer_type": "Dry Van",
            "load_type": "Test Freight",
            "weight_lbs": 1000,
            "stops": [
                {"stop_type": "pickup", "city": "Alpha", "state": "AA", "lat": 40.0, "lng": -80.0, "sequence": 1},
                {"stop_type": "dropoff", "city": "Beta", "state": "BB", "lat": 41.0, "lng": -81.0, "sequence": 2},
            ],
        },
    )
    assert res.status_code == 201, res.text

    # Search by customer name
    res2 = client.get("/orders", params={"q": "TEST_Customer", "page": 1, "page_size": 10})
    assert res2.status_code == 200, res2.text
    body = res2.json()
    assert body["total"] >= 1
    assert any(i["customer_name"] == "TEST_Customer" for i in body["items"])

