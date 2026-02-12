"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getOrders, type OrderListItem } from "@/lib/api";
import OrderList from "@/components/OrderList";
import OrderDrawer from "@/components/OrderDrawer";
import CreateOrderModal from "@/components/CreateOrderModal";

type TopTab = "inbound" | "outbound" | "bids";

interface FilterState {
  availableDate: string;
  timeWindow: string;
  pickup: string;
  delivery: string;
  equipment: string;
  shipper: string;
}

const sidebarGroups: Array<{ title: string; items: Array<{ label: string; active?: boolean }> }> = [
  {
    title: "Load Sourcing",
    items: [
      { label: "Freight Marketplace", active: true },
      { label: "RFP Management" },
    ],
  },
  {
    title: "Asset",
    items: [
      { label: "Scheduling" },
      { label: "Tracking" },
      { label: "Fleet management" },
    ],
  },
  {
    title: "Brokerage",
    items: [
      { label: "Brokerage Tracking" },
      { label: "Carrier Brokerage" },
    ],
  },
  {
    title: "CRM",
    items: [{ label: "CRM" }],
  },
  {
    title: "Voice Agents",
    items: [{ label: "SOP Builder" }, { label: "Communication" }],
  },
  {
    title: "Fleet Management",
    items: [{ label: "Quoting" }, { label: "Load Board" }],
  },
  {
    title: "",
    items: [{ label: "Settings" }],
  },
];

const initialFilters: FilterState = {
  availableDate: "",
  timeWindow: "",
  pickup: "",
  delivery: "",
  equipment: "all",
  shipper: "all",
};

function FilterDrawer({
  value,
  onChange,
  onClose,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onClose: () => void;
}) {
  return (
    <div className="filters-overlay" onClick={onClose}>
      <aside className="filters-panel" onClick={(event) => event.stopPropagation()}>
        <div className="filters-head">
          <h3>Filter</h3>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => onChange(initialFilters)}
            >
              Clear All
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              x
            </button>
          </div>
        </div>
        <p className="filters-sub">Filter loads based on filter</p>

        <div className="filters-scroll">
          <section className="filter-section">
            <h4>When</h4>
            <div className="filter-grid">
              <div>
                <label className="field-label">Available Date</label>
                <input
                  className="field-control"
                  type="date"
                  value={value.availableDate}
                  onChange={(e) => onChange({ ...value, availableDate: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Time Window</label>
                <select
                  className="select-control"
                  value={value.timeWindow}
                  onChange={(e) => onChange({ ...value, timeWindow: e.target.value })}
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
          </section>

          <section className="filter-section">
            <h4>Where</h4>
            <div className="filter-grid">
              <div>
                <label className="field-label">Pickup City/State</label>
                <input
                  className="field-control"
                  placeholder="Select city"
                  value={value.pickup}
                  onChange={(e) => onChange({ ...value, pickup: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Delivery City/State</label>
                <input
                  className="field-control"
                  placeholder="Select city"
                  value={value.delivery}
                  onChange={(e) => onChange({ ...value, delivery: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="filter-section">
            <h4>Refine Results</h4>
            <div className="filter-grid">
              <div>
                <label className="field-label">Equipment</label>
                <select
                  className="select-control"
                  value={value.equipment}
                  onChange={(e) => onChange({ ...value, equipment: e.target.value })}
                >
                  <option value="all">All types</option>
                  <option value="flatbed">Flatbed</option>
                  <option value="reefer">Reefer</option>
                  <option value="dry-van">Dry van</option>
                </select>
              </div>
              <div>
                <label className="field-label">Shipper</label>
                <select
                  className="select-control"
                  value={value.shipper}
                  onChange={(e) => onChange({ ...value, shipper: e.target.value })}
                >
                  <option value="all">All shippers</option>
                  <option value="preferred">Preferred</option>
                  <option value="new">New shippers</option>
                </select>
              </div>
            </div>
            <p className="filter-advanced">Show Advanced Filters</p>
          </section>
        </div>

        <div className="filters-footer">
          <button type="button" className="primary-btn" onClick={onClose}>
            Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function MarketplacePage() {
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [topTab, setTopTab] = useState<TopTab>("inbound");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const effectiveFilters = useMemo(
    () => ({
      available_date: filters.availableDate || undefined,
      time_window: filters.timeWindow || undefined,
      pickup: filters.pickup.trim() || undefined,
      delivery: filters.delivery.trim() || undefined,
      equipment: filters.equipment !== "all" ? filters.equipment : undefined,
      shipper: filters.shipper !== "all" ? filters.shipper : undefined,
    }),
    [filters]
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        q: searchQuery || undefined,
        page,
        page_size: pageSize,
        ...effectiveFilters,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, pageSize, effectiveFilters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedOrderId(null);
      return;
    }
    setSelectedOrderId((current) => {
      if (current != null && items.some((item) => item.id === current)) {
        return current;
      }
      return items[0].id;
    });
  }, [items]);

  const tabCounts = useMemo(
    () => ({ inbound: total, outbound: 0, bids: 0 }),
    [total]
  );

  return (
    <main className="app-frame">
      <aside className="shell-sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark" aria-hidden />
            Hemut
          </div>
        </div>

        <div className="sidebar-scroll">
          {sidebarGroups.map((group) => (
            <div key={group.title || group.items[0]?.label}>
              {group.title ? <p className="sidebar-group-title">{group.title}</p> : null}
              {group.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-item ${item.active ? "active" : ""}`}
                >
                  <span className="sidebar-item-icon">[]</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-foot-btn" aria-label="desktop">
            D
          </button>
          <button type="button" className="sidebar-foot-btn" aria-label="sun">
            S
          </button>
          <button type="button" className="sidebar-foot-btn" aria-label="moon">
            M
          </button>
        </div>
      </aside>

      <section className="app-main">
        <header className="main-top">
          <div className="breadcrumb">Load Sourcing / Freight Marketplace</div>
          <div className="top-actions">
            <div className="search-shell">
              <span>Search</span>
              <input type="text" placeholder="Search items, suppliers, customers..." />
            </div>
            <button type="button" className="icon-btn" aria-label="Alerts">
              3
            </button>
            <button type="button" className="badge-btn">
              View voice agents <span className="round-pill">3</span>
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setCreateOpen(true)}
            >
              + Create Order
            </button>
          </div>
        </header>

        <div className="market-inner">
          <div className="market-heading-row">
            <h1 className="market-title">Freight Marketplace</h1>
          </div>

          <div className="market-toolbar">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div className="market-tabs">
                <button
                  type="button"
                  className={`market-tab ${topTab === "inbound" ? "active" : ""}`}
                  onClick={() => setTopTab("inbound")}
                >
                  Inbound Loads <span className="tab-count">{tabCounts.inbound}</span>
                </button>
                <button
                  type="button"
                  className={`market-tab ${topTab === "outbound" ? "active" : ""}`}
                  onClick={() => setTopTab("outbound")}
                >
                  Outbound Loads <span className="tab-count">{tabCounts.outbound}</span>
                </button>
                <button
                  type="button"
                  className={`market-tab ${topTab === "bids" ? "active" : ""}`}
                  onClick={() => setTopTab("bids")}
                >
                  My Bids <span className="tab-count">{tabCounts.bids}</span>
                </button>
              </div>

              <div className="view-toggle">
                <button type="button" className="active" aria-label="list view">
                  =
                </button>
                <button type="button" aria-label="grid view">
                  #
                </button>
              </div>
            </div>

            <div className="market-search-row">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setFilterOpen(true)}
              >
                Filters
              </button>
              <div className="search-shell market-search">
                <span>Search</span>
                <input
                  type="search"
                  placeholder="Search loads by ID, origin, destination, shippers..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className={`market-body ${selectedOrderId == null ? "single" : ""}`}>
            <OrderList
              items={items}
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onSelectOrder={setSelectedOrderId}
              selectedId={selectedOrderId}
              loading={loading}
            />

            <OrderDrawer
              orderId={selectedOrderId}
              onClose={() => setSelectedOrderId(null)}
            />
          </div>
        </div>
      </section>

      {filterOpen ? (
        <FilterDrawer
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}

      {createOpen ? (
        <CreateOrderModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            loadOrders();
          }}
        />
      ) : null}
    </main>
  );
}
