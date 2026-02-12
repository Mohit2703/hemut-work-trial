"use client";

import { useEffect, useMemo, useState } from "react";
import { searchCustomers, type CustomerListItem } from "@/lib/api";

interface CustomerSearchSelectProps {
  value: CustomerListItem | null;
  onChange: (c: CustomerListItem | null) => void;
  placeholder?: string;
}

export default function CustomerSearchSelect({
  value,
  onChange,
  placeholder = "Select customer",
}: CustomerSearchSelectProps) {
  const [selectedId, setSelectedId] = useState<string>(value ? String(value.id) : "");
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(value ? String(value.id) : "");
  }, [value]);

  useEffect(() => {
    setLoading(true);
    searchCustomers("")
      .then((response) => {
        setItems(response.items);
        setLoadError(null);
      })
      .catch(() => {
        setItems([]);
        setLoadError("Failed to load customers");
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedFromItems = useMemo(
    () => items.find((customer) => customer.id === Number(selectedId)) ?? null,
    [items, selectedId]
  );

  const selectedCustomer = selectedFromItems ?? value ?? null;

  return (
    <div className="customer-search">
      <select
        className="customer-search-input"
        value={selectedId}
        onChange={(event) => {
          const nextId = event.target.value;
          setSelectedId(nextId);
          if (!nextId) {
            onChange(null);
            return;
          }

          const selected = items.find((customer) => customer.id === Number(nextId));
          onChange(selected ?? null);
        }}
      >
        <option value="">{loading ? "Loading customers..." : placeholder}</option>

        {selectedCustomer && !items.some((customer) => customer.id === selectedCustomer.id) ? (
          <option value={String(selectedCustomer.id)}>
            {selectedCustomer.name}
            {[selectedCustomer.city, selectedCustomer.state].filter(Boolean).length
              ? ` (${[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(", ")})`
              : ""}
          </option>
        ) : null}

        {items.map((customer) => (
          <option key={customer.id} value={String(customer.id)}>
            {customer.name}
            {[customer.city, customer.state].filter(Boolean).length
              ? ` (${[customer.city, customer.state].filter(Boolean).join(", ")})`
              : ""}
          </option>
        ))}
      </select>

      {loadError ? <p className="customer-search-error">{loadError}</p> : null}
    </div>
  );
}
