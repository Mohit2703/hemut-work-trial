# Freight Marketplace MVP

A freight marketplace application with FastAPI backend and Next.js frontend.

## Implementation Notes

- Detailed implementation documentation: `IMPLEMENTATION.md`

## Prerequisites

- Docker and Docker Compose

## How to Run

1. **Start all services:**
   ```bash
   docker compose up --build
   ```

2. **Apply migrations** (when available after Step 2):
   ```bash
   docker compose exec backend alembic upgrade head
   ```

3. **Run seed** (when available after Step 3):
   ```bash
   docker compose exec backend python scripts/seed.py
   ```

## URLs

- **Frontend:** http://localhost:3000 (redirects to `/marketplace`)
- **Backend API:** http://localhost:8000
- **Backend health:** http://localhost:8000/health

## API Endpoints

- `POST /orders` – Create order with stops (sets route_geometry, total_miles)
- `GET /orders` – List orders (search: `?q=`, pagination: `?page=1&page_size=10`)
- `GET /orders/{id}` – Single order with stops and route_geometry
- `PUT /orders/{id}/stops` – Replace stops (recomputes route_geometry, total_miles)
- `GET /customers?query=` – Search customers by name (ILIKE)

## Environment

Copy `.env.example` to `.env` and adjust if needed:

- `DATABASE_URL` – PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` – API base URL for the frontend
