import os

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://freight:freight@localhost:5432/freight_marketplace",
)
