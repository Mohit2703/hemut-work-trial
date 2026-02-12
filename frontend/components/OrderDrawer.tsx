"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrder, type OrderResponse } from "@/lib/api";

interface OrderDrawerProps {
  orderId: number | null;
  onClose: () => void;
}

type TabId = "load" | "customer" | "lane" | "calculator";

type MarginMode = "percentage" | "flat";

interface AccessoryItem {
  id: string;
  name: string;
  amount: number;
}

function formatStopDate(value?: string | null) {
  if (!value) return "Date: not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date: not specified";
  return `Date: ${date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function formatAddress(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ") || "Address unavailable";
}

function stopBadge(stopType: string) {
  if (stopType === "pickup") return "Pickup";
  if (stopType === "dropoff") return "Dropoff";
  return "Stop";
}

export default function OrderDrawer({ orderId, onClose }: OrderDrawerProps) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabId>("load");

  const [calcRate, setCalcRate] = useState(2.5);
  const [calcMiles, setCalcMiles] = useState(0);
  const [accessories, setAccessories] = useState<AccessoryItem[]>([
    { id: "a1", name: "Lumper Fee", amount: 150 },
    { id: "a2", name: "Detention Charge", amount: 75 },
  ]);
  const [marginMode, setMarginMode] = useState<MarginMode>("percentage");
  const [marginValue, setMarginValue] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    setLoading(true);
    getOrder(orderId)
      .then((response) => {
        setOrder(response);
        setCalcMiles(Math.round(response.total_miles ?? 0));
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  const sortedStops = useMemo(
    () => (order?.stops ? [...order.stops].sort((a, b) => a.sequence - b.sequence) : []),
    [order]
  );

  const laneLabel = useMemo(() => {
    if (sortedStops.length < 2) return "Lane not available";
    const first = sortedStops[0];
    const last = sortedStops[sortedStops.length - 1];
    const from = [first.city, first.state].filter(Boolean).join(", ");
    const to = [last.city, last.state].filter(Boolean).join(", ");
    return `${from || "Unknown"} -> ${to || "Unknown"}`;
  }, [sortedStops]);

  const baseCost = calcRate * calcMiles;
  const accessoryTotal = accessories.reduce((sum, item) => sum + item.amount, 0);
  const marginAmount =
    marginMode === "percentage"
      ? ((baseCost + accessoryTotal) * marginValue) / 100
      : marginValue;
  const quoteTotal = baseCost + accessoryTotal + marginAmount;

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "load", label: "Load Details" },
    { id: "customer", label: "Customer Details" },
    { id: "lane", label: "Lane History" },
    { id: "calculator", label: "Calculator" },
  ];

  function addAccessory() {
    setAccessories((current) => [
      ...current,
      { id: `${Date.now()}-${current.length + 1}`, name: "Tarping", amount: 0 },
    ]);
  }

  function removeAccessory(id: string) {
    setAccessories((current) => current.filter((item) => item.id !== id));
  }

  function updateAccessory(
    id: string,
    field: "name" | "amount",
    value: string | number
  ) {
    setAccessories((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (field === "amount") {
          return { ...item, amount: typeof value === "number" ? value : Number(value) || 0 };
        }
        return { ...item, name: String(value) };
      })
    );
  }

  if (orderId == null) return null;

  return (
    <aside className="order-drawer">
      <div className="drawer-head">
        <div className="drawer-title-wrap">
          <h2 className="drawer-title">{order?.customer?.name || "Load"}</h2>
          <div className="drawer-subtitle">{laneLabel}</div>
        </div>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
          x
        </button>
      </div>

      <div className="drawer-tabs">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`drawer-tab ${tab === item.id ? "active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="drawer-content">
        {loading ? <p className="list-status">Loading load details...</p> : null}

        {!loading && !order ? <p className="list-status">Load details are not available.</p> : null}

        {!loading && order && tab === "load" ? (
          <>
            <section className="drawer-card">
              <div className="data-grid two">
                <div className="item">
                  <div className="item-label">Load ID</div>
                  <div className="item-value">#{order.id.toString().padStart(6, "0")}</div>
                </div>
                <div className="item" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <Link className="secondary-btn" href={`/orders/${order.id}`}>
                    View on Map
                  </Link>
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span className="item-label">Contact Information</span>
                <strong style={{ fontSize: "calc(14px * var(--font-scale))" }}>
                  {order.customer?.phone || "Not provided"}
                </strong>
              </div>
            </section>

            <section className="drawer-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <h3 className="drawer-section-title">Shipment Details</h3>
                <Link className="secondary-btn" href={`/orders/${order.id}`}>
                  View on Map
                </Link>
              </div>
              <ul className="timeline">
                {sortedStops.map((stop) => (
                  <li key={stop.id} className="timeline-row">
                    <span className={`timeline-dot ${stop.stop_type}`.trim()} />
                    <div>
                      <p className="timeline-title">{stop.location_name || "Stop"}</p>
                      <p className="timeline-sub">
                        {formatAddress([stop.address, stop.city, stop.state, stop.zip])}
                      </p>
                      <p className="timeline-date">{formatStopDate(stop.scheduled_arrival_early)}</p>
                    </div>
                    <span className={`stop-tag ${stop.stop_type}`.trim()}>{stopBadge(stop.stop_type)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        {!loading && order && tab === "customer" ? (
          <>
            <section className="drawer-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div className="item-label">Customer Profile</div>
                  <div className="item-value" style={{ marginTop: 2 }}>{order.customer?.name || "Unknown customer"}</div>
                </div>
                <button type="button" className="secondary-btn">
                  Open in CRM
                </button>
              </div>
            </section>

            <section className="drawer-card">
              <h3 className="drawer-section-title">Company Information</h3>
              <div className="info-grid two">
                <div className="item">
                  <div className="item-label">Company Name</div>
                  <div className="item-value">{order.customer?.name || "Unknown"}</div>
                </div>
                <div className="item">
                  <div className="item-label">Legal Name</div>
                  <div className="item-value">{order.customer?.name || "Unknown"} LLC</div>
                </div>
              </div>
              <div className="info-grid three" style={{ marginTop: 8 }}>
                <div className="item">
                  <div className="item-label">MC Number</div>
                  <div className="item-value">{order.customer?.mc_number || "-"}</div>
                </div>
                <div className="item">
                  <div className="item-label">Phone</div>
                  <div className="item-value">{order.customer?.phone || "-"}</div>
                </div>
                <div className="item">
                  <div className="item-label">Email</div>
                  <div className="item-value">{order.customer?.email || "-"}</div>
                </div>
              </div>
            </section>

            <section className="drawer-card">
              <h3 className="drawer-section-title">Our Team Engagement</h3>
              <div className="team-list">
                <div className="team-pill">
                  <span className="team-avatar green">JS</span>
                  <span className="team-meta">
                    <strong>John Smith</strong>
                    <span>john.smith@company.com</span>
                  </span>
                </div>
                <div className="team-pill">
                  <span className="team-avatar blue">ED</span>
                  <span className="team-meta">
                    <strong>Emily Davis</strong>
                    <span>emily.davis@company.com</span>
                  </span>
                </div>
                <div className="team-pill">
                  <span className="team-avatar orange">MW</span>
                  <span className="team-meta">
                    <strong>Michael Wilson</strong>
                    <span>michael.w@company.com</span>
                  </span>
                </div>
              </div>
              <p style={{ color: "#737a86", fontSize: "calc(13px * var(--font-scale))", margin: "10px 0 0" }}>
                John Smith is the primary account manager. Emily Davis handles operations.
              </p>
            </section>
          </>
        ) : null}

        {!loading && order && tab === "lane" ? (
          <>
            <section className="drawer-card">
              <h3 className="drawer-section-title">Lane History</h3>
              <ul className="timeline">
                {sortedStops.slice(0, 2).map((stop, index) => (
                  <li key={stop.id} className="timeline-row">
                    <span className={`timeline-dot ${index === 0 ? "pickup" : "dropoff"}`} />
                    <div>
                      <p className="timeline-title">{stop.location_name || "Stop"}</p>
                      <p className="timeline-sub">
                        {formatAddress([stop.address, stop.city, stop.state, stop.zip])}
                      </p>
                      <p className="timeline-date">Date: not specified</p>
                    </div>
                    <span />
                  </li>
                ))}
              </ul>
            </section>

            <section className="drawer-card">
              <h3 className="drawer-section-title">Lane Statistics</h3>
              <div className="data-grid two">
                <div className="item">
                  <div className="item-label">Avg Rate</div>
                  <div className="item-value">$2.45/mi</div>
                </div>
                <div className="item">
                  <div className="item-label">Total Loads</div>
                  <div className="item-value">{18 + (order.id % 24)}</div>
                </div>
                <div className="item">
                  <div className="item-label">Last Load</div>
                  <div className="item-value">{7 + (order.id % 12)} days ago</div>
                </div>
                <div className="item">
                  <div className="item-label">Frequency</div>
                  <div className="item-value">Weekly</div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {!loading && order && tab === "calculator" ? (
          <>
            <section className="drawer-card">
              <h3 className="drawer-section-title">Base Cost</h3>
              <div className="calc-row">
                <div>
                  <label className="field-label">Rate (per mile)</label>
                  <input
                    className="calc-input"
                    type="number"
                    step="0.01"
                    value={Number.isFinite(calcRate) ? calcRate : 0}
                    onChange={(event) => setCalcRate(Number(event.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="field-label">Miles</label>
                  <input
                    className="calc-input"
                    type="number"
                    value={Number.isFinite(calcMiles) ? calcMiles : 0}
                    onChange={(event) => setCalcMiles(Number(event.target.value) || 0)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span className="item-label">Base Cost</span>
                <strong style={{ fontSize: "calc(24px * var(--font-scale))", lineHeight: 1 }}>
                  ${baseCost.toFixed(2)}
                </strong>
              </div>
            </section>

            <section className="drawer-card">
              <h3 className="drawer-section-title">Accessories</h3>
              {accessories.map((item) => (
                <div key={item.id} className="accessory-row">
                  <select
                    className="select-control"
                    value={item.name}
                    onChange={(event) => updateAccessory(item.id, "name", event.target.value)}
                  >
                    <option value="Lumper Fee">Lumper Fee</option>
                    <option value="Detention Charge">Detention Charge</option>
                    <option value="Tarping">Tarping</option>
                    <option value="Fuel Surcharge">Fuel Surcharge</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    className="calc-input"
                    type="number"
                    value={item.amount}
                    onChange={(event) =>
                      updateAccessory(item.id, "amount", Number(event.target.value) || 0)
                    }
                  />
                  <button
                    type="button"
                    className="icon-delete"
                    onClick={() => removeAccessory(item.id)}
                    aria-label="Remove accessory"
                  >
                    x
                  </button>
                </div>
              ))}
              <button type="button" className="ghost-btn" onClick={addAccessory}>
                + Add Accessory
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span className="item-label">Accessory Total</span>
                <strong style={{ fontSize: "calc(24px * var(--font-scale))", lineHeight: 1 }}>
                  ${accessoryTotal.toFixed(2)}
                </strong>
              </div>
            </section>

            <section className="drawer-card">
              <h3 className="drawer-section-title">Margin</h3>
              <div className="margin-mode">
                <button
                  type="button"
                  className={marginMode === "percentage" ? "active" : ""}
                  onClick={() => setMarginMode("percentage")}
                >
                  Percentage
                </button>
                <button
                  type="button"
                  className={marginMode === "flat" ? "active" : ""}
                  onClick={() => setMarginMode("flat")}
                >
                  Flat Amount
                </button>
              </div>
              <div style={{ marginTop: 10 }}>
                <label className="field-label">
                  {marginMode === "percentage" ? "Margin (%)" : "Flat Amount ($)"}
                </label>
                <input
                  className="calc-input"
                  type="number"
                  step="0.01"
                  value={marginValue}
                  onChange={(event) => setMarginValue(Number(event.target.value) || 0)}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span className="item-label">Calculated Margin</span>
                <strong style={{ fontSize: "calc(24px * var(--font-scale))", lineHeight: 1 }}>
                  ${marginAmount.toFixed(2)}
                </strong>
              </div>
            </section>

            <section className="drawer-card">
              <h3 className="drawer-section-title">Quote Summary</h3>
              <div className="data-grid two">
                <div className="item">
                  <div className="item-label">Base</div>
                  <div className="item-value">${baseCost.toFixed(2)}</div>
                </div>
                <div className="item">
                  <div className="item-label">Accessories</div>
                  <div className="item-value">${accessoryTotal.toFixed(2)}</div>
                </div>
                <div className="item">
                  <div className="item-label">Margin</div>
                  <div className="item-value">${marginAmount.toFixed(2)}</div>
                </div>
                <div className="item">
                  <div className="item-label">Quote Total</div>
                  <div className="item-value">${quoteTotal.toFixed(2)}</div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <div className={`drawer-footer-actions ${tab === "calculator" ? "" : "single"}`}>
        <button type="button" className="ghost-btn">
          Find Best Driver
        </button>
        {tab === "calculator" ? (
          <button type="button" className="primary-btn">
            Get Quote
          </button>
        ) : null}
      </div>
    </aside>
  );
}
