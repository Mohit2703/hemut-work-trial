"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrders, type OrderListItem } from "@/lib/api";
import OrderList from "@/components/OrderList";
import OrderDrawer from "@/components/OrderDrawer";
import CreateOrderModal from "@/components/CreateOrderModal";

export default function MarketplacePage() {
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ q: searchQuery || undefined, page, page_size: pageSize });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, pageSize]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ margin: 0 }}>Freight Marketplace</h1>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          style={{ padding: "0.5rem 1rem", background: "#f0c000", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
        >
          Create Order
        </button>
      </div>
      <p style={{ margin: "0 0 1rem", color: "#666" }}>Inbound Loads</p>

      <OrderList
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPageChange={setPage}
        onSelectOrder={setSelectedOrderId}
        selectedId={selectedOrderId}
        loading={loading}
      />

      {createOpen && (
        <CreateOrderModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            // refresh list after creating order
            loadOrders();
          }}
        />
      )}

      <OrderDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </main>
  );
}
