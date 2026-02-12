# Freight Marketplace MVP - Step-by-Step Implementation Plan

This plan is designed to execute **one step at a time** with explicit testing before moving to the next step.

## Execution Rules
1. Implement only the current step.
2. Run that step's tests/checks.
3. If checks fail, fix before proceeding.
4. Commit after each passing step.
5. Move to the next step only when current step is green.

## Step 1 - Project scaffold + Docker baseline
**Build:**
- Create monorepo structure (`backend/`, `frontend/`, root docs/files).
- Add `docker-compose.yml` with services: `db` (Postgres), `backend` (FastAPI), `frontend` (Next.js).
- Add `.env.example`.

**Checks:**
- `docker compose config` passes.
- `docker compose up --build -d` starts all services.
- Backend health endpoint returns 200.
- Frontend root page loads.

**Commit:** `chore: scaffold project and docker compose baseline`

---

## Step 2 - Backend app skeleton + DB wiring
**Build:**
- FastAPI app entrypoint, DB session setup, config loading.
- SQLAlchemy + Alembic initialization.
- Base app router structure.

**Checks:**
- Backend container starts cleanly.
- `alembic current` runs without error.

**Commit:** `chore: initialize fastapi app, sqlalchemy, and alembic`

---

## Step 3 - ORM models + initial migration
**Build:**
- SQLAlchemy models: `Customer`, `Order`, `Stop` (+ optional `LaneHistory`).
- Fields, relationships, constraints.
- Route geometry JSONB on `orders`.
- Search indexes:
  - `customers.name`
  - `orders.customer_id`
  - `stops(order_id, sequence)`

**Checks:**
- `alembic revision --autogenerate` (or explicit migration file).
- `alembic upgrade head` succeeds.
- Verify tables/indexes exist in Postgres.

**Commit:** `feat: add core orm models and initial migration`

---

## Step 4 - Seed data
**Build:**
- Seed script for customers + orders + nested stops.
- Include 2-4 stops per order.
- Compute route geometry as LineString from stop sequence.

**Checks:**
- Run seed command successfully.
- DB sanity queries show expected row counts.
- Spot-check one seeded order includes stops + geometry.

**Commit:** `feat: add seed data for customers orders and stops`

---

## Step 5 - Validation schemas + shared service helpers
**Build:**
- Pydantic request/response schemas.
- Validation rules (stops min count, pickup/dropoff presence, lat/lng bounds, etc.).
- Service helper for geometry recomputation and origin/destination derivation.

**Checks:**
- Backend startup validates schema imports.
- Unit-level sanity for geometry helper.

**Commit:** `feat: add api schemas and order geometry helpers`

---

## Step 6 - `POST /orders` (transactional nested create)
**Build:**
- Create order with nested stops in one transaction.
- Return created order with ordered stops + geometry.

**Checks:**
- Backend test: create order success.
- Backend test: invalid payload returns 422.
- Verify data persisted correctly in DB.

**Commit:** `feat: implement create order endpoint with nested stops`

---

## Step 7 - `GET /orders` (search + pagination)
**Build:**
- List endpoint with `query`, `page`, `page_size`.
- Search by order id, customer name, origin, destination.

**Checks:**
- Backend test: list pagination metadata correct.
- Backend test: search query matches expected results.

**Commit:** `feat: implement list orders with search and pagination`

---

## Step 8 - `GET /orders/{id}` details
**Build:**
- Order detail with customer, ordered stops, route geometry.
- Include lane history stats payload (computed or mocked from backend data).

**Checks:**
- Detail endpoint returns full object shape.
- 404 behavior for unknown id.

**Commit:** `feat: implement order details endpoint with stops and lane history`

---

## Step 9 - `PUT /orders/{id}/stops` (Enhancement A)
**Build:**
- Replace/reorder/add/remove stops.
- Recompute sequence, geometry, and origin/destination.

**Checks:**
- Backend test: reorder persists sequence correctly.
- Backend test: geometry updates after reorder.
- Endpoint validation for invalid stop sets.

**Commit:** `feat: implement stop replace reorder endpoint with geometry recompute`

---

## Step 10 - `GET /customers?query=`
**Build:**
- Customer fuzzy search with ILIKE.
- Return limited results for select input.

**Checks:**
- Endpoint returns matched customers sorted by relevance/basic ordering.
- Empty query behavior is stable and documented.

**Commit:** `feat: implement customer search endpoint`

---

## Step 11 - Frontend foundation + API client
**Build:**
- Next.js app skeleton.
- Shared API client and typed interfaces.
- Route shell: `/marketplace`, `/orders/[id]`.

**Checks:**
- Frontend compiles in Docker.
- API client can fetch backend from container network.

**Commit:** `chore: scaffold nextjs app routes and api client`

---

## Step 12 - Marketplace page (list + search + pagination + drawer)
**Build:**
- Inbound orders table.
- Search input + pagination controls.
- Row click opens right-side drawer with tabs:
  - Load Details
  - Customer Details
  - Lane History
  - Calculator

**Checks:**
- Manual UI check for all listed interactions.
- Verify API calls and pagination state transitions.

**Commit:** `feat: implement marketplace list and details drawer with tabs`

---

## Step 13 - Create Order modal/form
**Build:**
- Minimal create form with:
  - customer search select
  - trailer type, load type/commodity, weight, notes
  - stops add/remove with required fields
- Submit via `POST /orders`.

**Checks:**
- Manual create flow works end-to-end.
- Validation errors visible in UI.
- New order appears in marketplace list.

**Commit:** `feat: add create order modal with nested stops submission`

---

## Step 14 - Order details page + map + reorder UI
**Build:**
- `/orders/[id]` page with ordered stop list.
- Leaflet map markers + polyline from geometry.
- Up/down controls to reorder stops and persist via `PUT /orders/{id}/stops`.

**Checks:**
- Reorder updates UI and persists after refresh.
- Polyline updates after reorder.

**Commit:** `feat: implement order details page with map and stop reordering`

---

## Step 15 - Tests, docs, final smoke run
**Build:**
- Ensure at least 2 backend tests (create + list/search or reorder).
- Write `README.md` (compose up, migrations, seed, URLs, demo script).
- Write `ARCHITECTURE.md` (tradeoffs, geo storage, future improvements).

**Checks:**
- `docker compose up --build` clean startup.
- Backend tests pass.
- Manual smoke: create order -> view in list -> open details -> reorder stops.

**Commit:** `docs: add architecture and runbook; test: finalize backend coverage`

---

## Suggested Test Commands (standardized)
- `docker compose up --build -d`
- `docker compose exec backend alembic upgrade head`
- `docker compose exec backend python -m app.seed`
- `docker compose exec backend pytest -q`
- `docker compose logs backend --tail=100`
- `docker compose logs frontend --tail=100`

## Definition of Done
- All required endpoints implemented and validated.
- Database migrations + seed working.
- Marketplace page + order details page + create order flow functional.
- Enhancement A fully shipped (reorder + persist + polyline recompute).
- Basic tests passing and docs complete.
