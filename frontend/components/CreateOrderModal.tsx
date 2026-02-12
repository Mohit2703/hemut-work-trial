"use client";

import { useMemo, useState } from "react";
import {
  createOrder,
  type CustomerListItem,
  type OrderCreate,
  type StopCreate,
} from "@/lib/api";
import CustomerSearchSelect from "./CustomerSearchSelect";

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type StepId = "order" | "stops" | "shipment" | "references" | "notes";

type StepDef = {
  id: StepId;
  label: string;
  icon: string;
  title: string;
  subtitle: string;
};

interface StopRow {
  id: string;
  stop_type: "pickup" | "stop" | "dropoff";
  location_name: string;
  location_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  scheduled_arrival_early: string;
  scheduled_arrival_late: string;
  driver_load: string;
  contact_name: string;
  contact_number: string;
  email: string;
  notes: string;
}

const stepDefs: StepDef[] = [
  {
    id: "order",
    label: "Order Details",
    icon: "1",
    title: "Order Details",
    subtitle: "Basic information about the order",
  },
  {
    id: "stops",
    label: "Stops",
    icon: "2",
    title: "Stops",
    subtitle: "Add pickup and delivery locations",
  },
  {
    id: "shipment",
    label: "Shipment",
    icon: "3",
    title: "Shipment Details",
    subtitle: "Freight specifications and pricing",
  },
  {
    id: "references",
    label: "References",
    icon: "4",
    title: "Reference Numbers",
    subtitle: "Optional order identifiers",
  },
  {
    id: "notes",
    label: "Notes",
    icon: "5",
    title: "Internal Notes",
    subtitle: "Add any additional notes for this order",
  },
];

const usStates = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const commodityOptions = [
  "General Freight",
  "Steel Coils",
  "Electronics",
  "Food & Beverage",
  "Machinery",
  "Lumber",
];

function emptyStop(stopType: "pickup" | "stop" | "dropoff"): StopRow {
  return {
    id: crypto.randomUUID(),
    stop_type: stopType,
    location_name: "",
    location_id: "",
    address: "",
    city: "",
    state: "OH",
    zip: "",
    scheduled_arrival_early: "",
    scheduled_arrival_late: "",
    driver_load: "Live Load",
    contact_name: "",
    contact_number: "",
    email: "",
    notes: "",
  };
}

function stopTypeLabel(stopType: StopRow["stop_type"]) {
  if (stopType === "pickup") return "Pickup";
  if (stopType === "dropoff") return "Dropoff";
  return "Stop";
}

export default function CreateOrderModal({ onClose, onSuccess }: CreateOrderModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const [customer, setCustomer] = useState<CustomerListItem | null>(null);
  const [equipmentType, setEquipmentType] = useState("Flatbed");
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");

  const [stops, setStops] = useState<StopRow[]>([
    emptyStop("pickup"),
    emptyStop("dropoff"),
  ]);

  const [weightLbs, setWeightLbs] = useState<number | "">("");
  const [miles, setMiles] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [commodity, setCommodity] = useState("General Freight");

  const [orderReference, setOrderReference] = useState("");
  const [billOfLading, setBillOfLading] = useState("");
  const [shipmentReference, setShipmentReference] = useState("");

  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / stepDefs.length) * 100),
    [stepIndex]
  );

  function updateStop(index: number, key: keyof StopRow, value: string | number) {
    setStops((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    );
  }

  function addStop() {
    setStops((current) => {
      const next = [...current];
      next.splice(Math.max(1, next.length - 1), 0, emptyStop("stop"));
      return next;
    });
  }

  function removeStop(index: number) {
    if (stops.length <= 2) return;
    setStops((current) => current.filter((_, i) => i !== index));
  }

  function moveStop(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === stops.length - 1) return;

    setStops((current) => {
      const next = [...current];
      const target = direction === "up" ? index - 1 : index + 1;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function validateCurrentStep() {
    const step = stepDefs[stepIndex];

    if (step.id === "order") {
      if (!customer) return "Customer name is required.";
      return null;
    }

    if (step.id === "stops") {
      if (stops.length < 2) return "At least two stops are required.";
      if (!stops.some((stop) => stop.stop_type === "pickup")) {
        return "At least one pickup stop is required.";
      }
      if (!stops.some((stop) => stop.stop_type === "dropoff")) {
        return "At least one dropoff stop is required.";
      }
      return null;
    }

    return null;
  }

  async function submitOrder() {
    if (!customer) {
      setError("Customer name is required.");
      return;
    }

    const stopPayloads: StopCreate[] = stops.map((stop, index) => ({
      stop_type: stop.stop_type,
      location_name: stop.location_name || undefined,
      address: stop.address || undefined,
      city: stop.city || undefined,
      state: stop.state || undefined,
      zip: stop.zip || undefined,
      scheduled_arrival_early: stop.scheduled_arrival_early || undefined,
      scheduled_arrival_late: stop.scheduled_arrival_late || undefined,
      sequence: index + 1,
    }));

    const payload: OrderCreate = {
      customer_id: customer.id,
      trailer_type: equipmentType || undefined,
      load_type: commodity || undefined,
      weight_lbs: typeof weightLbs === "number" ? weightLbs : undefined,
      notes:
        [
          notes,
          orderReference ? `OrderRef: ${orderReference}` : "",
          billOfLading ? `BOL: ${billOfLading}` : "",
          shipmentReference ? `ShipmentRef: ${shipmentReference}` : "",
          contactName ? `Contact: ${contactName}` : "",
          contactNumber ? `Phone: ${contactNumber}` : "",
          email ? `Email: ${email}` : "",
          miles > 0 ? `Miles: ${miles}` : "",
          rate > 0 ? `Rate: ${rate}` : "",
        ]
          .filter(Boolean)
          .join("\n") || undefined,
      stops: stopPayloads,
    };

    setSubmitting(true);
    setError(null);

    try {
      const order = await createOrder(payload);
      onSuccess();
      onClose();
      window.location.href = `/orders/${order.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePrimaryAction() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    if (stepIndex === stepDefs.length - 1) {
      await submitOrder();
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleStepBack() {
    if (stepIndex === 0) return;
    setError(null);
    setStepIndex((current) => current - 1);
  }

  const currentStep = stepDefs[stepIndex];

  return (
    <div className="create-modal-backdrop" onClick={onClose}>
      <div className="create-modal" onClick={(event) => event.stopPropagation()}>
        <aside className="create-rail">
          <div className="create-rail-top">
            <h3 className="create-rail-title">Create Order</h3>
            <p className="create-rail-desc">
              Complete all steps to create a new freight order with stop details.
            </p>
          </div>

          <ol className="step-list">
            {stepDefs.map((step, index) => (
              <li
                key={step.id}
                className={`step-item ${
                  index === stepIndex ? "current" : index < stepIndex ? "done" : ""
                }`}
              >
                <span className="step-icon">{step.icon}</span>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>

          <div className="create-rail-foot">
            <div className="rail-progress-head">
              <span>
                Step {stepIndex + 1} of {stepDefs.length}
              </span>
              <strong>{progress}%</strong>
            </div>
            <div className="rail-progress-track">
              <div className="rail-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </aside>

        <section className="create-content">
          <header className="create-head">
            <button type="button" onClick={onClose} aria-label="Close">
              x
            </button>
          </header>

          <div className="create-body">
            <h2 className="create-section-title">{currentStep.title}</h2>
            <p className="create-section-sub">{currentStep.subtitle}</p>

            {currentStep.id === "order" ? (
              <div className="form-grid" style={{ gap: 12 }}>
                <div>
                  <label className="field-label">Customer Name *</label>
                  <CustomerSearchSelect
                    value={customer}
                    onChange={setCustomer}
                    placeholder="Select customer"
                  />
                </div>

                <div>
                  <label className="field-label">Equipment Type *</label>
                  <select
                    className="select-control"
                    value={equipmentType}
                    onChange={(event) => setEquipmentType(event.target.value)}
                  >
                    <option value="Flatbed">Flatbed</option>
                    <option value="Dry Van">Dry Van</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Lowboy">Lowboy</option>
                    <option value="Conestoga">Conestoga</option>
                  </select>
                </div>

                <div className="form-grid two">
                  <div>
                    <label className="field-label">Contact Person</label>
                    <input
                      className="field-control"
                      value={contactName}
                      onChange={(event) => setContactName(event.target.value)}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <label className="field-label">Contact Number</label>
                    <input
                      className="field-control"
                      value={contactNumber}
                      onChange={(event) => setContactNumber(event.target.value)}
                      placeholder="(555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Email</label>
                  <input
                    className="field-control"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            ) : null}

            {currentStep.id === "stops" ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                  <p className="create-section-sub" style={{ margin: 0 }}>
                    Add each stop in order. Lat/lng are auto-calculated from location.
                  </p>
                  <button type="button" className="secondary-btn" onClick={addStop}>
                    + Add Stop
                  </button>
                </div>

                {stops.map((stop, index) => (
                  <article key={stop.id} className="stop-card">
                    <div className="stop-head">
                      <h4>
                        Stop {index + 1} <span className={`mini-badge ${stop.stop_type === "pickup" ? "green" : stop.stop_type === "dropoff" ? "orange" : "blue"}`}>{stopTypeLabel(stop.stop_type)}</span>
                      </h4>
                      <div className="stop-actions">
                        <button
                          type="button"
                          onClick={() => moveStop(index, "up")}
                          disabled={index === 0}
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(index, "down")}
                          disabled={index === stops.length - 1}
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStop(index)}
                          disabled={stops.length <= 2}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="form-grid two">
                      <div>
                        <label className="field-label">Stop Type</label>
                        <select
                          className="select-control"
                          value={stop.stop_type}
                          onChange={(event) =>
                            updateStop(index, "stop_type", event.target.value as StopRow["stop_type"])
                          }
                        >
                          <option value="pickup">Pickup</option>
                          <option value="stop">Stop</option>
                          <option value="dropoff">Dropoff</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Location ID</label>
                        <input
                          className="field-control"
                          value={stop.location_id}
                          onChange={(event) => updateStop(index, "location_id", event.target.value)}
                          placeholder="Enter location ID"
                        />
                      </div>
                    </div>

                    <div className="form-grid two" style={{ marginTop: 8 }}>
                      <div>
                        <label className="field-label">Location Name</label>
                        <input
                          className="field-control"
                          value={stop.location_name}
                          onChange={(event) => updateStop(index, "location_name", event.target.value)}
                          placeholder="Enter location name"
                        />
                      </div>
                      <div>
                        <label className="field-label">Address</label>
                        <input
                          className="field-control"
                          value={stop.address}
                          onChange={(event) => updateStop(index, "address", event.target.value)}
                          placeholder="Street address"
                        />
                      </div>
                    </div>

                    <div className="form-grid three" style={{ marginTop: 8 }}>
                      <div>
                        <label className="field-label">City</label>
                        <input
                          className="field-control"
                          value={stop.city}
                          onChange={(event) => updateStop(index, "city", event.target.value)}
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="field-label">State</label>
                        <select
                          className="select-control"
                          value={stop.state}
                          onChange={(event) => updateStop(index, "state", event.target.value)}
                        >
                          {usStates.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Zip Code</label>
                        <input
                          className="field-control"
                          value={stop.zip}
                          onChange={(event) => updateStop(index, "zip", event.target.value)}
                          placeholder="00000"
                        />
                      </div>
                    </div>

                    <div className="form-grid two" style={{ marginTop: 8 }}>
                      <div>
                        <label className="field-label">Scheduled Arrival (Early)</label>
                        <input
                          className="field-control"
                          type="datetime-local"
                          value={stop.scheduled_arrival_early}
                          onChange={(event) =>
                            updateStop(index, "scheduled_arrival_early", event.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="field-label">Scheduled Arrival (Late)</label>
                        <input
                          className="field-control"
                          type="datetime-local"
                          value={stop.scheduled_arrival_late}
                          onChange={(event) =>
                            updateStop(index, "scheduled_arrival_late", event.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginTop: 8 }}>
                      <div>
                        <label className="field-label">Driver Load</label>
                        <select
                          className="select-control"
                          value={stop.driver_load}
                          onChange={(event) => updateStop(index, "driver_load", event.target.value)}
                        >
                          <option value="Live Load">Live Load</option>
                          <option value="Drop & Hook">Drop & Hook</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid three" style={{ marginTop: 8 }}>
                      <div>
                        <label className="field-label">Contact Name</label>
                        <input
                          className="field-control"
                          value={stop.contact_name}
                          onChange={(event) => updateStop(index, "contact_name", event.target.value)}
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <label className="field-label">Contact Number</label>
                        <input
                          className="field-control"
                          value={stop.contact_number}
                          onChange={(event) => updateStop(index, "contact_number", event.target.value)}
                          placeholder="(555) 000-0000"
                        />
                      </div>
                      <div>
                        <label className="field-label">Email</label>
                        <input
                          className="field-control"
                          value={stop.email}
                          onChange={(event) => updateStop(index, "email", event.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <label className="field-label">Notes</label>
                      <textarea
                        className="textarea-control"
                        rows={2}
                        value={stop.notes}
                        onChange={(event) => updateStop(index, "notes", event.target.value)}
                        placeholder="Additional instructions"
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {currentStep.id === "shipment" ? (
              <div className="form-grid two">
                <div>
                  <label className="field-label">Weight (lbs)</label>
                  <input
                    className="field-control"
                    type="number"
                    value={weightLbs}
                    onChange={(event) =>
                      setWeightLbs(event.target.value === "" ? "" : Number(event.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="field-label">Miles</label>
                  <input
                    className="field-control"
                    type="number"
                    value={miles}
                    onChange={(event) => setMiles(Number(event.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="field-label">Rate ($)</label>
                  <input
                    className="field-control"
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(event) => setRate(Number(event.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="field-label">Commodity</label>
                  <select
                    className="select-control"
                    value={commodity}
                    onChange={(event) => setCommodity(event.target.value)}
                  >
                    {commodityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {currentStep.id === "references" ? (
              <div className="form-grid" style={{ gap: 10 }}>
                <div>
                  <label className="field-label">Order ID</label>
                  <input
                    className="field-control"
                    value={orderReference}
                    onChange={(event) => setOrderReference(event.target.value)}
                    placeholder="Enter order ID"
                  />
                </div>
                <div>
                  <label className="field-label">Bill of Lading</label>
                  <input
                    className="field-control"
                    value={billOfLading}
                    onChange={(event) => setBillOfLading(event.target.value)}
                    placeholder="Enter BOL number"
                  />
                </div>
                <div>
                  <label className="field-label">Shipment ID</label>
                  <input
                    className="field-control"
                    value={shipmentReference}
                    onChange={(event) => setShipmentReference(event.target.value)}
                    placeholder="Enter shipment ID"
                  />
                </div>
              </div>
            ) : null}

            {currentStep.id === "notes" ? (
              <div>
                <label className="field-label">Notes</label>
                <textarea
                  className="textarea-control"
                  rows={8}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Enter any additional notes or special instructions"
                />
              </div>
            ) : null}

            {error ? <p className="create-error">{error}</p> : null}
          </div>

          <footer className="create-foot">
            <button
              type="button"
              className="ghost-btn"
              onClick={handleStepBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>

            <div className="create-foot-right">
              <button
                type="button"
                className="primary-btn"
                onClick={handlePrimaryAction}
                disabled={submitting}
              >
                {submitting
                  ? "Creating..."
                  : stepIndex === stepDefs.length - 1
                    ? "Create Order"
                    : "Next Step"}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
