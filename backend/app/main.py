from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine

app = FastAPI(title="Freight Marketplace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    """Verify database connection on startup."""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))


@app.get("/health")
def health():
    return {"status": "ok"}
