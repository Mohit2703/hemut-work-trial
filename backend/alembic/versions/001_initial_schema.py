"""Initial schema: customers, orders, stops, lane_history

Revision ID: 001_initial
Revises:
Create Date: 2025-02-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("mc_number", sa.String(64), nullable=True),
        sa.Column("dot_number", sa.String(64), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(128), nullable=True),
        sa.Column("state", sa.String(32), nullable=True),
        sa.Column("zip", sa.String(32), nullable=True),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_customers_id"), "customers", ["id"], unique=False)
    op.create_index(op.f("ix_customers_name"), "customers", ["name"], unique=False)

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("customer_id", sa.Integer(), nullable=False),
        sa.Column("trailer_type", sa.String(64), nullable=True),
        sa.Column("load_type", sa.String(128), nullable=True),
        sa.Column("weight_lbs", sa.Integer(), nullable=True),
        sa.Column("notes", sa.String(1024), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="draft"),
        sa.Column("route_geometry", JSONB, nullable=True),
        sa.Column("total_miles", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="RESTRICT"),
    )
    op.create_index(op.f("ix_orders_id"), "orders", ["id"], unique=False)
    op.create_index(op.f("ix_orders_customer_id"), "orders", ["customer_id"], unique=False)

    op.create_table(
        "stops",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("stop_type", sa.String(32), nullable=False),
        sa.Column("location_name", sa.String(255), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(128), nullable=True),
        sa.Column("state", sa.String(32), nullable=True),
        sa.Column("zip", sa.String(32), nullable=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lng", sa.Float(), nullable=True),
        sa.Column("scheduled_arrival_early", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scheduled_arrival_late", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("order_id", "sequence", name="uq_stops_order_id_sequence"),
    )
    op.create_index(op.f("ix_stops_id"), "stops", ["id"], unique=False)
    op.create_index(op.f("ix_stops_order_id"), "stops", ["order_id"], unique=False)

    op.create_table(
        "lane_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("origin_city", sa.String(128), nullable=True),
        sa.Column("origin_state", sa.String(32), nullable=True),
        sa.Column("destination_city", sa.String(128), nullable=True),
        sa.Column("destination_state", sa.String(32), nullable=True),
        sa.Column("avg_rate_per_mile", sa.Float(), nullable=True),
        sa.Column("total_loads", sa.Integer(), nullable=True),
        sa.Column("last_load_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("frequency_label", sa.String(64), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_lane_history_id"), "lane_history", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lane_history_id"), table_name="lane_history")
    op.drop_table("lane_history")
    op.drop_index(op.f("ix_stops_order_id"), table_name="stops")
    op.drop_index(op.f("ix_stops_id"), table_name="stops")
    op.drop_table("stops")
    op.drop_index(op.f("ix_orders_customer_id"), table_name="orders")
    op.drop_index(op.f("ix_orders_id"), table_name="orders")
    op.drop_table("orders")
    op.drop_index(op.f("ix_customers_name"), table_name="customers")
    op.drop_index(op.f("ix_customers_id"), table_name="customers")
    op.drop_table("customers")
