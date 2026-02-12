"use client";

import { useState } from "react";
import {
  createOrder,
  type OrderCreate,
  type StopCreate,
  type CustomerListItem,
} from "@/lib/api";
import CustomerSearchSelect from "./CustomerSearchSelect";

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface StopRow {
  id: string;
  stop_type: "pickup" | "stop" | "dropoff";
  location_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number | "";
  lng: number | "";
  scheduled_arrival_early: string;
  scheduled_arrival_late: string;
}

const emptyStop = (): StopRow => ({
  id: crypto.randomUUID(),
  stop_type: "pickup",
  location_name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  lat: "",
  lng: "",
  scheduled_arrival_early: "",
  scheduled_arrival_late: "",
});

export default function CreateOrderModal({ onClose, onSuccess }: CreateOrderModalProps) {
  const [customer, setCustomer] = useState<CustomerListItem | null>(null);
  const [trailerType, setTrailerType] = useState("");
  const [loadType, setLoadType] = useState("");
  const [weightLbs, setWeightLbs] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [stops, setStops] = useState<StopRow[]>([emptyStop(), emptyStop()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStop() {
    setStops((s) => [...s, emptyStop()]);
  }

  function removeStop(index: number) {
    setStops((s) => s.filter((_, i) => i !== index));
  }

  function moveStop(index: number, dir: "up" | "down") {
    if (dir === "up" && index <= 0) return;
    if (dir === "down" && index >= stops.length - 1) return;
    const next = [...stops];
    const j = dir === "up" ? index - 1 : index + 1;
    [next[index], next[j]] = [next[j], next[index]];
    setStops(next);
  }

  function updateStop(index: number, field: keyof StopRow, value: string | number) {
    setStops((s) =>
      s.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customer) {
      setError("Select a customer.");
      return;
    }
    if (stops.length === 0) {
      setError("Add at least one stop.");
      return;
    }
    const stopPayloads: StopCreate[] = stops.map((s, i) => ({
      stop_type: s.stop_type,
      location_name: s.location_name || undefined,
      address: s.address || undefined,
      city: s.city || undefined,
      state: s.state || undefined,
      zip: s.zip || undefined,
      lat: typeof s.lat === "number" ? s.lat : undefined,
      lng: typeof s.lng === "number" ? s.lng : undefined,
      scheduled_arrival_early: s.scheduled_arrival_early || undefined,
      scheduled_arrival_late: s.scheduled_arrival_late || undefined,
      sequence: i + 1,
    }));
    const body: OrderCreate = {
      customer_id: customer.id,
      trailer_type: trailerType || undefined,
      load_type: loadType || undefined,
      weight_lbs: typeof weightLbs === "number" ? weightLbs : undefined,
      notes: notes || undefined,
      stops: stopPayloads,
    };
    setSubmitting(true);
    createOrder(body)
      .then((order) => {
        onSuccess();
        onClose();
        window.location.href = `/orders/${order.id}`;
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to create order");
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: 8,
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 1rem" }}>Create Order</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Customer *</label>
              <CustomerSearchSelect value={customer} onChange={setCustomer} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>Trailer type</label>
                <input
                  type="text"
                  value={trailerType}
                  onChange={(e) => setTrailerType(e.target.value)}
                  placeholder="e.g. Flatbed"
                  style={{ width: "100%", padding: "0.5rem" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>Load type</label>
                <input
                  type="text"
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                  placeholder="e.g. Steel Coils"
                  style={{ width: "100%", padding: "0.5rem" }}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>Weight (lbs)</label>
                <input
                  type="number"
                  value={weightLbs === "" ? "" : weightLbs}
                  onChange={(e) =>
                    setWeightLbs(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  style={{ width: "100%", padding: "0.5rem" }}
                />
              </div>
              <div />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem" }}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{ width: "100%", padding: "0.5rem" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <strong>Stops</strong>
                <button type="button" onClick={addStop}>Add stop</button>
              </div>
              {stops.map((stop, index) => (
                <div
                  key={stop.id}
                  style={{
                    border: "1px solid #eee",
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>Stop {index + 1}</span>
                    <span>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveStop(index, "up")}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={index === stops.length - 1}
                        onClick={() => moveStop(index, "down")}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        disabled={stops.length <= 1}
                        onClick={() => removeStop(index)}
                      >
                        Remove
                      </button>
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                    <select
                      value={stop.stop_type}
                      onChange={(e) =>
                        updateStop(index, "stop_type", e.target.value as StopRow["stop_type"])
                      }
                    >
                      <option value="pickup">Pickup</option>
                      <option value="stop">Stop</option>
                      <option value="dropoff">Dropoff</option>
                    </select>
                    <input
                      placeholder="Location name"
                      value={stop.location_name}
                      onChange={(e) => updateStop(index, "location_name", e.target.value)}
                      style={{ padding: "0.4rem" }}
                    />
                    <input
                      placeholder="Address"
                      value={stop.address}
                      onChange={(e) => updateStop(index, "address", e.target.value)}
                      style={{ padding: "0.4rem" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.25rem" }}>
                      <input
                        placeholder="City"
                        value={stop.city}
                        onChange={(e) => updateStop(index, "city", e.target.value)}
                        style={{ padding: "0.4rem" }}
                      />
                      <input
                        placeholder="State"
                        value={stop.state}
                        onChange={(e) => updateStop(index, "state", e.target.value)}
                        style={{ padding: "0.4rem" }}
                      />
                      <input
                        placeholder="ZIP"
                        value={stop.zip}
                        onChange={(e) => updateStop(index, "zip", e.target.value)}
                        style={{ padding: "0.4rem" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem" }}>
                      <input
                        type="number"
                        step="any"
                        placeholder="Lat"
                        value={stop.lat === "" ? "" : stop.lat}
                        onChange={(e) =>
                          updateStop(
                            index,
                            "lat",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        style={{ padding: "0.4rem" }}
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Lng"
                        value={stop.lng === "" ? "" : stop.lng}
                        onChange={(e) =>
                          updateStop(
                            index,
                            "lng",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        style={{ padding: "0.4rem" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem" }}>
                      <input
                        type="datetime-local"
                        placeholder="Scheduled early"
                        value={stop.scheduled_arrival_early}
                        onChange={(e) =>
                          updateStop(index, "scheduled_arrival_early", e.target.value)
                        }
                        style={{ padding: "0.4rem" }}
                      />
                      <input
                        type="datetime-local"
                        placeholder="Scheduled late"
                        value={stop.scheduled_arrival_late}
                        onChange={(e) =>
                          updateStop(index, "scheduled_arrival_late", e.target.value)
                        }
                        style={{ padding: "0.4rem" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
