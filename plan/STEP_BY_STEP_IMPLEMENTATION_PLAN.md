# Freight Marketplace MVP - Step-by-Step Implementation Plan

**Reference:** [screenshots/](screenshots/) (Hemut-inspired UI: list, right-side panel with Load Details / Customer Details / Lane History / Calculator, Create Order, order details with stops).

**How to use:** Execute **one step at a time**. At the end of each step, run the **Testing** checklist. Commit after each step. Do not skip steps.

**Execution order:** Step 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

---

## Step 1 – Scaffold (repo, Docker, back/front skeletons)

**Scope:**
- Root: `docker-compose.yml` (services: postgres, backend, frontend), `.env.example` (DATABASE_URL, NEXT_PUBLIC_API_URL).
- `backend/`: Dockerfile (Python 3.11+), `requirements.txt` (fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic, alembic), `app/main.py` (FastAPI app, CORS, GET /health), `app/config.py` (DB URL from env).
- `frontend/`: Next.js (App Router, TypeScript), Dockerfile, `app/layout.tsx`, `app/page.tsx` (redirect to /marketplace).
- README: docker compose up, migrations, seed, main URLs.

**Testing:**
- From repo root: `docker compose up --build`. Backend: `curl http://localhost:8000/health` returns 200. Frontend: open http://localhost:3000, redirects to /marketplace. Postgres up; backend starts without DB errors (no tables yet OK).

**Commit:** `Scaffold: docker-compose, backend FastAPI, frontend Next.js`

---

## Step 2 – Database models, Alembic, session

**Scope:**
- `backend/app/database.py`: engine, SessionLocal, Base, get_db().
- `backend/app/models/`: customer.py, order.py, stop.py (optional lane_history.py). Fields/indexes: see plan/API_AND_MODELS.md. orders.route_geometry JSONB.
- models/__init__.py exports all. Alembic init; env.py uses app config/database; one initial migration (customers, orders, stops + indexes).
- main.py: app starts and can connect to DB.

**Testing:**
- `docker compose up`. `alembic upgrade head`. Tables customers, orders, stops exist; indexes present. Backend starts.

**Commit:** `Add SQLAlchemy models and Alembic initial migration`

---

## Step 3 – Seed data

**Scope:**
- `backend/scripts/seed.py`: 5–8 customers, 3–5 orders with 2–4 stops each; compute route_geometry (LineString from stops by sequence). Idempotent.
- README: add "Run seed" (e.g. `docker compose exec backend python scripts/seed.py`).

**Testing:**
- Run migrations then seed. `SELECT COUNT(*) FROM customers` (5–8). One order has route_geometry JSON with type and coordinates.

**Commit:** `Add seed script and seed data`

---

## Step 4 – Orders and customers API

**Scope:**
- `backend/app/schemas/`: Pydantic for order create/response, stop create/update, list response, customer response. Match API_AND_MODELS.md.
- `backend/app/services/geometry.py`: stops → GeoJSON LineString dict.
- `backend/app/routers/orders.py`: POST /orders, GET /orders (q, page, page_size), GET /orders/{id}, PUT /orders/{id}/stops. Validation: ≥1 stop, valid customer_id, unique sequences; 400/404.
- `backend/app/routers/customers.py`: GET /customers?query= (ILIKE name).
- main.py: include routers.

**Testing:**
- POST /orders (body from API_AND_MODELS.md) → 201, response has id, stops, route_geometry. GET /orders → 200; GET /orders?q=... and ?page=2&page_size=2 work. GET /orders/1 → 200; GET /orders/99999 → 404. PUT /orders/1/stops → 200. GET /customers?query=xyz → 200.

**Commit:** `Implement orders and customers API`

---

## Step 5 – Frontend: marketplace list + drawer

**Scope:**
- `frontend/lib/api.ts`: getOrders, getOrder, createOrder, updateOrderStops, searchCustomers.
- `frontend/app/marketplace/page.tsx`: list, search, page, selectedOrderId; fetch GET /orders; table/list; row click sets selected id.
- Drawer: fetch GET /orders/{id}; tabs: Load Details (stops + "View on Map" → /orders/[id]), Customer Details, Lane History (mock stats), Calculator (base $/mi, miles, accessorials, margin → total). "Create Order" button.

**Testing:**
- /marketplace shows list; search/pagination work; row click opens drawer; all four tabs; View on Map links to /orders/1.

**Commit:** `Frontend: marketplace list and details drawer with tabs`

---

## Step 6 – Create Order modal + Order details page

**Scope:**
- Create Order modal: customer search (GET /customers), trailer_type, load_type, weight, notes; stops add/remove/reorder; per-stop type, location, address, city, state, zip, lat, lng, scheduled early/late. Submit POST /orders; on success close and refresh list.
- `frontend/app/orders/[id]/page.tsx`: fetch GET /orders/[id]; ordered stops list; Leaflet map (markers + polyline from route_geometry.coordinates [lng,lat]).

**Testing:**
- Create order flow works; new order in list and drawer; /orders/[newId] shows stops and map with polyline.

**Commit:** `Create Order modal and order details page with map`

---

## Step 7 – Tests and docs

**Scope:**
- ≥2 backend tests (pytest): e.g. POST /orders → 201 with route_geometry; GET /orders search or PUT /orders/{id}/stops reorder.
- ARCHITECTURE.md: tradeoffs, GeoJSON in JSONB, future improvements.
- README: docker compose up, migrations, seed, URLs, demo script.

**Testing:**
- `docker compose exec backend pytest` – both tests pass. ARCHITECTURE.md and README complete.

**Commit:** `Add backend tests and ARCHITECTURE.md`

---

## Step 8 – One enhancement (pick A, B, or C)

**A) Reorder stops:** Up/down on /orders/[id]; PUT /orders/{id}/stops; geometry recompute; map updates.  
**B) Customer search ranking:** ILIKE + score; return sorted.  
**C) Lane history:** lane_history table + seed; endpoint for lane stats; Lane History tab uses it.

**Testing:** A: reorder and map update. B: result order. C: Lane tab shows backend stats.

**Commit:** `Enhancement: [A|B|C]`

---

## Suggested commands

- `docker compose up --build -d`
- `docker compose exec backend alembic upgrade head`
- `docker compose exec backend python scripts/seed.py`
- `docker compose exec backend pytest -q`
- `curl http://localhost:8000/health`
- `curl "http://localhost:8000/orders?page=1&page_size=5"`
