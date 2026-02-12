"""
Seed script for Freight Marketplace.
Inserts 5-8 customers and 3-5 orders with 2-4 stops each.
Idempotent: skips if customers already exist.
Run: docker compose exec backend python scripts/seed.py
"""
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Ensure app is on path when run as script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import Customer, Order, Stop
from app.services.geometry import stops_to_linestring, compute_total_miles


def seed():
    db = SessionLocal()
    try:
        if db.query(Customer).count() > 0:
            print("Customers already exist. Skipping seed (idempotent).")
            return

        # 5–8 customers
        customers_data = [
            {"name": "XYZ Products", "mc_number": "MC-1001", "address": "1250 Industrial Pkwy", "city": "Cleveland", "state": "OH", "zip": "44135", "phone": "216-555-0101", "email": "ops@xyzproducts.com"},
            {"name": "LMN Services", "mc_number": "MC-1002", "address": "800 Commerce Dr", "city": "Chicago", "state": "IL", "zip": "60601", "phone": "312-555-0102", "email": "logistics@lmnservices.com"},
            {"name": "PQR Solutions", "mc_number": "MC-1003", "address": "450 Warehouse Blvd", "city": "Detroit", "state": "MI", "zip": "48201", "phone": "313-555-0103", "email": "dispatch@pqrsolutions.com"},
            {"name": "EFG Innovations", "mc_number": "MC-1004", "address": "200 Mill Rd", "city": "Rockford", "state": "IL", "zip": "61101", "phone": "815-555-0104", "email": "shipping@efginnovations.com"},
            {"name": "ABC Distribution", "mc_number": "MC-1005", "address": "1600 Freight Way", "city": "Indianapolis", "state": "IN", "zip": "46201", "phone": "317-555-0105", "email": "orders@abcdistribution.com"},
            {"name": "Champion Brands LLC", "mc_number": "MC-1006", "address": "3200 Industrial Pkwy", "city": "Columbus", "state": "OH", "zip": "43215", "phone": "614-555-0106", "email": "freight@championbrands.com"},
        ]
        customers = []
        for c in customers_data:
            cust = Customer(**c)
            db.add(cust)
            db.flush()
            customers.append(cust)
        db.commit()
        # Re-fetch to get committed ids for orders
        customer_ids = [c.id for c in customers]
        print(f"Inserted {len(customers)} customers.")

        # 3–5 orders with 2–4 stops each (real-looking city/state/zip and lat/lng)
        base_time = datetime(2025, 10, 1, 8, 0, 0, tzinfo=timezone.utc)

        orders_config = [
            {
                "customer_id": customer_ids[0],
                "trailer_type": "Flatbed",
                "load_type": "Steel Coils",
                "weight_lbs": 22000,
                "notes": "Handle with care",
                "stops": [
                    {"stop_type": "pickup", "location_name": "XYZ Warehouse", "address": "1250 Industrial Pkwy", "city": "Cleveland", "state": "OH", "zip": "44135", "lat": 41.42, "lng": -81.70, "seq": 1, "early": 0, "late": 4},
                    {"stop_type": "dropoff", "location_name": "Rockford Steel", "address": "100 Mill Rd", "city": "Rockford", "state": "IL", "zip": "61101", "lat": 42.27, "lng": -89.06, "seq": 2, "early": 10, "late": 12},
                ],
            },
            {
                "customer_id": customer_ids[1],
                "trailer_type": "Dry Van",
                "load_type": "Electronics",
                "weight_lbs": 12000,
                "notes": "Temperature controlled",
                "stops": [
                    {"stop_type": "pickup", "location_name": "LMN Chicago Hub", "address": "800 Commerce Dr", "city": "Chicago", "state": "IL", "zip": "60601", "lat": 41.88, "lng": -87.62, "seq": 1, "early": 0, "late": 2},
                    {"stop_type": "stop", "location_name": "Indianapolis Crossdock", "address": "1600 Freight Way", "city": "Indianapolis", "state": "IN", "zip": "46201", "lat": 39.77, "lng": -86.16, "seq": 2, "early": 6, "late": 8},
                    {"stop_type": "dropoff", "location_name": "ABC Distribution", "address": "1600 Freight Way", "city": "Indianapolis", "state": "IN", "zip": "46201", "lat": 39.78, "lng": -86.15, "seq": 3, "early": 12, "late": 14},
                ],
            },
            {
                "customer_id": customer_ids[2],
                "trailer_type": "Reefer",
                "load_type": "Perishables",
                "weight_lbs": 38000,
                "notes": None,
                "stops": [
                    {"stop_type": "pickup", "location_name": "PQR Detroit Cold Storage", "address": "450 Warehouse Blvd", "city": "Detroit", "state": "MI", "zip": "48201", "lat": 42.33, "lng": -83.05, "seq": 1, "early": 0, "late": 2},
                    {"stop_type": "dropoff", "location_name": "Columbus Food Terminal", "address": "3200 Industrial Pkwy", "city": "Columbus", "state": "OH", "zip": "43215", "lat": 39.96, "lng": -83.00, "seq": 2, "early": 8, "late": 10},
                ],
            },
            {
                "customer_id": customer_ids[3],
                "trailer_type": "Flatbed",
                "load_type": "Machinery",
                "weight_lbs": 45000,
                "notes": "Oversized load",
                "stops": [
                    {"stop_type": "pickup", "location_name": "EFG Rockford Plant", "address": "200 Mill Rd", "city": "Rockford", "state": "IL", "zip": "61101", "lat": 42.27, "lng": -89.06, "seq": 1, "early": 0, "late": 4},
                    {"stop_type": "stop", "location_name": "Chicago Yard", "address": "200 Hub Rd", "city": "Chicago", "state": "IL", "zip": "60601", "lat": 41.88, "lng": -87.62, "seq": 2, "early": 6, "late": 8},
                    {"stop_type": "dropoff", "location_name": "Cleveland Industrial", "address": "1250 Industrial Pkwy", "city": "Cleveland", "state": "OH", "zip": "44135", "lat": 41.42, "lng": -81.70, "seq": 3, "early": 14, "late": 18},
                ],
            },
            {
                "customer_id": customer_ids[4],
                "trailer_type": "Dry Van",
                "load_type": "General Freight",
                "weight_lbs": 28000,
                "notes": None,
                "stops": [
                    {"stop_type": "pickup", "location_name": "ABC Indianapolis", "address": "1600 Freight Way", "city": "Indianapolis", "state": "IN", "zip": "46201", "lat": 39.77, "lng": -86.16, "seq": 1, "early": 0, "late": 2},
                    {"stop_type": "stop", "location_name": "Dayton Terminal", "address": "500 Logistics Dr", "city": "Dayton", "state": "OH", "zip": "45402", "lat": 39.76, "lng": -84.19, "seq": 2, "early": 4, "late": 6},
                    {"stop_type": "stop", "location_name": "Cincinnati Hub", "address": "700 River Rd", "city": "Cincinnati", "state": "OH", "zip": "45202", "lat": 39.10, "lng": -84.51, "seq": 3, "early": 8, "late": 10},
                    {"stop_type": "dropoff", "location_name": "Columbus DC", "address": "3200 Industrial Pkwy", "city": "Columbus", "state": "OH", "zip": "43215", "lat": 39.96, "lng": -83.00, "seq": 4, "early": 12, "late": 14},
                ],
            },
        ]

        for oc in orders_config:
            order = Order(
                customer_id=oc["customer_id"],
                trailer_type=oc["trailer_type"],
                load_type=oc["load_type"],
                weight_lbs=oc["weight_lbs"],
                notes=oc["notes"],
                status="draft",
            )
            db.add(order)
            db.flush()

            for s in oc["stops"]:
                early = base_time + timedelta(hours=s["early"])
                late = base_time + timedelta(hours=s["late"])
                stop = Stop(
                    order_id=order.id,
                    sequence=s["seq"],
                    stop_type=s["stop_type"],
                    location_name=s["location_name"],
                    address=s["address"],
                    city=s["city"],
                    state=s["state"],
                    zip=s["zip"],
                    lat=s["lat"],
                    lng=s["lng"],
                    scheduled_arrival_early=early,
                    scheduled_arrival_late=late,
                )
                db.add(stop)

            db.flush()
            # Reload stops for this order to build geometry and total_miles
            stops_for_order = db.query(Stop).filter(Stop.order_id == order.id).order_by(Stop.sequence).all()
            order.route_geometry = stops_to_linestring(stops_for_order)
            order.total_miles = compute_total_miles(stops_for_order)
            db.add(order)

        db.commit()
        print(f"Inserted {len(orders_config)} orders with stops and route_geometry.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
