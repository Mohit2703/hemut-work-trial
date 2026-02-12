/**
 * API client for Freight Marketplace backend.
 * Base URL from NEXT_PUBLIC_API_URL (e.g. http://localhost:8000).
 */

const BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : process.env.NEXT_PUBLIC_API_URL || "http://backend:8000";

export interface StopResponse {
  id: number;
  order_id: number;
  stop_type: string;
  location_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  scheduled_arrival_early?: string | null;
  scheduled_arrival_late?: string | null;
  sequence: number;
}

export interface CustomerCard {
  id: number;
  name: string;
  mc_number?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface OrderResponse {
  id: number;
  customer_id: number;
  trailer_type?: string | null;
  load_type?: string | null;
  weight_lbs?: number | null;
  notes?: string | null;
  status: string;
  route_geometry?: { type: string; coordinates: [number, number][] } | null;
  total_miles?: number | null;
  stops: StopResponse[];
  created_at: string;
  customer?: CustomerCard | null;
}

export interface OrderListItem {
  id: number;
  customer_id: number;
  customer_name: string;
  trailer_type?: string | null;
  load_type?: string | null;
  weight_lbs?: number | null;
  origin_city?: string | null;
  origin_state?: string | null;
  destination_city?: string | null;
  destination_state?: string | null;
  total_miles?: number | null;
  status: string;
  created_at: string;
}

export interface OrderListResponse {
  items: OrderListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CustomerListItem {
  id: number;
  name: string;
  mc_number?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface StopCreate {
  stop_type: string;
  location_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  scheduled_arrival_early?: string | null;
  scheduled_arrival_late?: string | null;
  sequence: number;
}

export interface OrderCreate {
  customer_id: number;
  trailer_type?: string | null;
  load_type?: string | null;
  weight_lbs?: number | null;
  notes?: string | null;
  stops: StopCreate[];
}

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(Array.isArray(err.detail) ? err.detail.map((e: { msg: string }) => e.msg).join(", ") : err.detail || res.statusText);
  }
  return res.json();
}

export function getOrders(params: {
  q?: string;
  page?: number;
  page_size?: number;
}): Promise<OrderListResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.page_size != null) sp.set("page_size", String(params.page_size));
  const query = sp.toString();
  return fetchApi<OrderListResponse>(`/orders${query ? `?${query}` : ""}`);
}

export function getOrder(id: number): Promise<OrderResponse> {
  return fetchApi<OrderResponse>(`/orders/${id}`);
}

export function createOrder(body: OrderCreate): Promise<OrderResponse> {
  return fetchApi<OrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateOrderStops(
  id: number,
  stops: (StopCreate & { id?: number })[]
): Promise<OrderResponse> {
  return fetchApi<OrderResponse>(`/orders/${id}/stops`, {
    method: "PUT",
    body: JSON.stringify({ stops }),
  });
}

export function searchCustomers(query: string): Promise<{ items: CustomerListItem[] }> {
  if (!query.trim()) return Promise.resolve({ items: [] });
  return fetchApi<{ items: CustomerListItem[] }>(
    `/customers?query=${encodeURIComponent(query.trim())}`
  );
}
