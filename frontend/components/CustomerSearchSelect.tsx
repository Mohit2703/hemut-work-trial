"use client";

import { useState, useEffect, useRef } from "react";
import { searchCustomers, type CustomerListItem } from "@/lib/api";

interface CustomerSearchSelectProps {
  value: CustomerListItem | null;
  onChange: (c: CustomerListItem | null) => void;
  placeholder?: string;
}

export default function CustomerSearchSelect({
  value,
  onChange,
  placeholder = "Search customer...",
}: CustomerSearchSelectProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [items, setItems] = useState<CustomerListItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      searchCustomers(query)
        .then((r) => {
          setItems(r.items);
          setOpen(true);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!e.target.value) onChange(null);
        }}
        onFocus={() => items.length > 0 && setOpen(true)}
        style={{ width: "100%", padding: "0.5rem" }}
      />
      {loading && (
        <span style={{ position: "absolute", right: 8, top: 8, fontSize: "0.8rem", color: "#666" }}>
          ...
        </span>
      )}
      {open && items.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "#fff",
            border: "1px solid #ccc",
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 10,
          }}
        >
          {items.map((c) => (
            <li
              key={c.id}
              style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #eee" }}
              onClick={() => {
                onChange(c);
                setQuery(c.name);
                setOpen(false);
              }}
            >
              {c.name}
              {(c.city || c.state) && (
                <span style={{ color: "#666", marginLeft: "0.5rem" }}>
                  {[c.city, c.state].filter(Boolean).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
