"use client";

import type { OrderListItem } from "@/lib/api";

interface OrderListProps {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectOrder: (id: number) => void;
  selectedId?: number | null;
  loading?: boolean;
}

const tags = [
  { label: "EDI Order", tone: "green" },
  { label: "Load Board", tone: "orange" },
  { label: "Email", tone: "blue" },
] as const;

const originTimes = ["8:00 AM", "7:00 AM", "6:00 AM", "5:00 AM", "9:00 AM", "7:30 AM"];
const destinationTimes = ["8:00 PM", "3:00 PM", "10:30 AM", "2:00 PM", "1:00 PM", "4:30 PM"];

function resolveTag(order: OrderListItem) {
  return tags[order.id % tags.length];
}

function resolveTimes(order: OrderListItem) {
  const index = order.id % originTimes.length;
  return {
    pickup: originTimes[index],
    dropoff: destinationTimes[index],
  };
}

export default function OrderList({
  items,
  total,
  page,
  pageSize,
  onPageChange,
  onSelectOrder,
  selectedId,
  loading,
}: OrderListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="order-list-surface">
      <div className="order-list-head">
        <span>Inbound Loads</span>
        <span>{total} total</span>
      </div>

      <div className="order-list-body">
        {loading ? (
          <p className="list-status">Loading loads...</p>
        ) : items.length === 0 ? (
          <p className="list-status">No loads found for this search.</p>
        ) : (
          items.map((order) => {
            const tag = resolveTag(order);
            const times = resolveTimes(order);
            const origin = [order.origin_city, order.origin_state].filter(Boolean).join(", ") || "Unknown";
            const destination =
              [order.destination_city, order.destination_state].filter(Boolean).join(", ") ||
              "Unknown";

            return (
              <article
                key={order.id}
                role="button"
                tabIndex={0}
                className={`order-row ${selectedId === order.id ? "active" : ""}`}
                onClick={() => onSelectOrder(order.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectOrder(order.id);
                  }
                }}
              >
                <div className="company-block">
                  <div className="company-title">
                    {order.customer_name}
                    <span className={`mini-badge ${tag.tone}`}>{tag.label}</span>
                  </div>
                  <div className="order-id">#{order.id.toString().padStart(6, "0")}</div>
                </div>

                <div className="city-cell">
                  <div className="city-name">{origin}</div>
                  <div className="city-time">{times.pickup}</div>
                </div>

                <div className="route-truck" aria-hidden>
                  🚚
                </div>

                <div className="city-cell dest-cell">
                  <div className="city-name">{destination}</div>
                  <div className="city-time">{times.dropoff}</div>
                </div>

                <div className="route-meta meta-cell">
                  <span>{Math.round(order.total_miles ?? 0)} mi</span>
                  <span className="dot">|</span>
                  <span>{order.weight_lbs != null ? `${order.weight_lbs.toLocaleString()} lbs` : "-"}</span>
                  <span className="dot">|</span>
                  <span>{order.trailer_type || "Any trailer"}</span>
                  <span className="dot">|</span>
                  <span>{order.load_type || "General freight"}</span>
                </div>

                <div className="row-actions">
                  <button type="button" className="agent-btn" onClick={(event) => event.stopPropagation()}>
                    {order.id % 2 === 0 ? "View Agent" : "Deploy Agent"}
                  </button>
                  <button type="button" className="bid-btn" onClick={(event) => event.stopPropagation()}>
                    Bid
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {totalPages > 1 ? (
        <div className="list-pagination">
          <div className="list-pagination-text">
            Page {page} of {totalPages}
          </div>
          <div className="buttons">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
