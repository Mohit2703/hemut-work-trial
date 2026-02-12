"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrder, type OrderResponse } from "@/lib/api";

interface OrderDrawerProps {
  orderId: number | null;
  onClose: () => void;
}

type TabId = "load" | "customer" | "lane" | "calculator";

export default function OrderDrawer({ orderId, onClose }: OrderDrawerProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>("load");
  const [calcBase, setCalcBase] = useState(2.5);
  const [calcMiles, setCalcMiles] = useState(400);
  const [calcAccessorials, setCalcAccessorials] = useState(50);
  const [calcMargin, setCalcMargin] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    getOrder(orderId)
      .then((o) => {
        setOrder(o);
        setCalcMiles(o.total_miles ?? 400);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (orderId == null) return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: "load", label: "Load Details" },
    { id: "customer", label: "Customer Details" },
    { id: "lane", label: "Lane History" },
    { id: "calculator", label: "Calculator" },
  ];

  const sortedStops = order?.stops
    ? [...order.stops].sort((a, b) => a.sequence - b.sequence)
    : [];
  const originDest =
    sortedStops.length >= 2
      ? `${sortedStops[0].city ?? ""}, ${sortedStops[0].state ?? ""} → ${sortedStops[sortedStops.length - 1].city ?? ""}, ${sortedStops[sortedStops.length - 1].state ?? ""}`
      : "—";

  const calculatorTotal =
    calcBase * calcMiles + calcAccessorials + calcMargin;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "min(420px, 100vw)",
        height: "100vh",
        background: "#fff",
        boxShadow: "-4px 0 16px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
            {order?.customer_id ? `Order #${order.id}` : "Order details"}
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#666" }}>
            {originDest}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: "0.6rem 0.4rem",
              border: "none",
              background: tab === id ? "#f0f0f0" : "transparent",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
        {loading ? (
          <p>Loading…</p>
        ) : !order ? (
          <p>Failed to load order.</p>
        ) : tab === "load" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
              <Link href={`/orders/${order.id}`} style={{ fontSize: "0.9rem" }}>
                View on Map
              </Link>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {sortedStops.map((s) => (
                <li
                  key={s.id}
                  style={{
                    padding: "0.5rem 0",
                    borderBottom: "1px solid #eee",
                    fontSize: "0.9rem",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background:
                        s.stop_type === "pickup"
                          ? "green"
                          : s.stop_type === "dropoff"
                            ? "red"
                            : "#369",
                      marginRight: "0.5rem",
                    }}
                  />
                  <strong>{s.location_name || "Stop"}</strong> ({s.stop_type})
                  <br />
                  <span style={{ color: "#555" }}>
                    {[s.address, s.city, s.state, s.zip].filter(Boolean).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : tab === "customer" ? (
          <div>
            {order.customer ? (
              <div style={{ fontSize: "0.9rem" }}>
                <p><strong>{order.customer.name}</strong></p>
                {order.customer.mc_number && (
                  <p>MC: {order.customer.mc_number}</p>
                )}
                {(order.customer.city || order.customer.state) && (
                  <p>
                    {[order.customer.city, order.customer.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {order.customer.phone && <p>Phone: {order.customer.phone}</p>}
                {order.customer.email && <p>Email: {order.customer.email}</p>}
              </div>
            ) : (
              <p>No customer details available.</p>
            )}
          </div>
        ) : tab === "lane" ? (
          <div style={{ fontSize: "0.9rem" }}>
            <p><strong>Lane History (mock)</strong></p>
            <p>Avg rate: $2.45/mi</p>
            <p>Last load: 15 days ago</p>
            <p>Frequency: Weekly</p>
          </div>
        ) : (
          <div style={{ fontSize: "0.9rem" }}>
            <p><strong>Calculator</strong></p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label>
                Base rate ($/mi):{" "}
                <input
                  type="number"
                  step="0.01"
                  value={calcBase}
                  onChange={(e) => setCalcBase(Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </label>
              <label>
                Miles:{" "}
                <input
                  type="number"
                  value={calcMiles}
                  onChange={(e) => setCalcMiles(Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </label>
              <label>
                Accessorials ($):{" "}
                <input
                  type="number"
                  value={calcAccessorials}
                  onChange={(e) => setCalcAccessorials(Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </label>
              <label>
                Margin ($):{" "}
                <input
                  type="number"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </label>
              <p style={{ marginTop: "0.75rem", fontWeight: "bold" }}>
                Total: ${calculatorTotal.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
