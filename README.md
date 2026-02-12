# Freight Marketplace MVP

A freight marketplace application with FastAPI backend and Next.js frontend.

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

## Environment

Copy `.env.example` to `.env` and adjust if needed:

- `DATABASE_URL` – PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` – API base URL for the frontend
