"use client";

import type { OrderListItem } from "@/lib/api";

interface OrderListProps {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectOrder: (id: number) => void;
  selectedId?: number | null;
  loading?: boolean;
}

export default function OrderList({
  items,
  total,
  page,
  pageSize,
  searchQuery,
  onSearchChange,
  onPageChange,
  onSelectOrder,
  selectedId,
  loading,
}: OrderListProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const origin = (o: OrderListItem) =>
    [o.origin_city, o.origin_state].filter(Boolean).join(", ") || "—";
  const dest = (o: OrderListItem) =>
    [o.destination_city, o.destination_state].filter(Boolean).join(", ") || "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search by ID, origin, destination, customer..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ padding: "0.5rem 0.75rem", minWidth: "260px" }}
        />
        <span style={{ color: "#666", fontSize: "0.9rem" }}>
          {total} order{total !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>ID</th>
                <th style={{ padding: "0.5rem" }}>Customer</th>
                <th style={{ padding: "0.5rem" }}>Origin</th>
                <th style={{ padding: "0.5rem" }}>Destination</th>
                <th style={{ padding: "0.5rem" }}>Miles</th>
                <th style={{ padding: "0.5rem" }}>Trailer</th>
                <th style={{ padding: "0.5rem" }}>Load type</th>
                <th style={{ padding: "0.5rem" }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "1rem", color: "#666" }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => onSelectOrder(o.id)}
                    style={{
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      background: selectedId === o.id ? "#fffbe6" : undefined,
                    }}
                  >
                    <td style={{ padding: "0.5rem" }}>#{o.id}</td>
                    <td style={{ padding: "0.5rem" }}>{o.customer_name}</td>
                    <td style={{ padding: "0.5rem" }}>{origin(o)}</td>
                    <td style={{ padding: "0.5rem" }}>{dest(o)}</td>
                    <td style={{ padding: "0.5rem" }}>{o.total_miles ?? "—"}</td>
                    <td style={{ padding: "0.5rem" }}>{o.trailer_type ?? "—"}</td>
                    <td style={{ padding: "0.5rem" }}>{o.load_type ?? "—"}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {o.weight_lbs != null ? `${o.weight_lbs.toLocaleString()} lbs` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
