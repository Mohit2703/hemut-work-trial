"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getOrder, type OrderResponse } from "@/lib/api";

const OrderDetailsMap = dynamic(() => import("@/components/OrderDetailsMap"), { ssr: false });

export default function OrderDetailsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(id) || id < 1) {
      setLoading(false);
      setError("Invalid order ID");
      return;
    }
    setLoading(true);
    setError(null);
    getOrder(id)
      .then(setOrder)
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main style={{ padding: "2rem" }}>Loading…</main>;
  if (error || !order) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>{error || "Order not found"}</p>
        <Link href="/marketplace">Back to Marketplace</Link>
      </main>
    );
  }

  const sortedStops = [...order.stops].sort((a, b) => a.sequence - b.sequence);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/marketplace" style={{ marginRight: "1rem" }}>← Marketplace</Link>
      </div>
      <h1 style={{ margin: "0 0 0.5rem" }}>Order #{order.id}</h1>
      <p style={{ margin: 0, color: "#666" }}>
        {order.trailer_type ?? "—"} · {order.load_type ?? "—"}
        {order.weight_lbs != null && ` · ${order.weight_lbs.toLocaleString()} lbs`}
      </p>

      <h2 style={{ margin: "1.5rem 0 0.5rem" }}>Stops</h2>
      <ol style={{ paddingLeft: "1.25rem", marginBottom: "1.5rem" }}>
        {sortedStops.map((s) => (
          <li key={s.id} style={{ marginBottom: "0.5rem" }}>
            <strong>{s.location_name || "Stop"}</strong> ({s.stop_type})
            {[s.city, s.state].filter(Boolean).length > 0 && (
              <span style={{ color: "#555", marginLeft: "0.5rem" }}>
                {[s.city, s.state].filter(Boolean).join(", ")}
              </span>
            )}
          </li>
        ))}
      </ol>

      <h2 style={{ margin: "1.5rem 0 0.5rem" }}>Route</h2>
      <OrderDetailsMap routeGeometry={order.route_geometry ?? null} stops={order.stops} />
    </main>
  );
}
