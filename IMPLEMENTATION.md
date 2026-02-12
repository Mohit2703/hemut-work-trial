# Freight Marketplace - Implementation Documentation

This document summarizes the implementation changes completed in this project across backend and frontend.

## 1) High-Level Summary

The following major improvements were implemented:

- Customer selection in Create Order switched from manual search typing to dropdown-based selection.
- Create Order modal scroll behavior fixed for long forms.
- Order list typography and layout adjusted for improved readability.
- Order list checkbox removed; truck emoji added between origin and destination.
- Sidebar and logo removed from marketplace layout; top header now shows only `Hemut`.
- Filtering in marketplace made functional end-to-end (frontend + backend).
- Stop latitude/longitude entry removed from Create Order.
- Latitude/longitude now auto-derived from location data using Nominatim.
- Route miles now computed using OSRM and shown in Create Order form.
- Backend still persists route geometry and total miles during order create/update.

## 2) Frontend Changes

### 2.1 Marketplace Layout

File: `frontend/app/marketplace/page.tsx`

- Removed left sidebar UI.
- Removed logo mark usage.
- Added simple top brand label: `Hemut`.

File: `frontend/app/globals.css`

- Added `.top-brand` style for header branding.

### 2.2 Order List UI

File: `frontend/components/OrderList.tsx`

- Removed checkbox column from each order row.
- Added truck emoji (`🚚`) between origin and destination columns.

File: `frontend/app/globals.css`

- Updated `.order-row` grid to remove checkbox column and include truck slot.
- Reduced font sizes for:
  - Customer name (`.company-title`)
  - Origin and destination (`.city-name`)
- Added `.route-truck` styling.
- Updated responsive grid behavior for tablet/mobile widths.

### 2.3 Create Order Modal

File: `frontend/components/CreateOrderModal.tsx`

- Removed manual stop `lat/lng` fields from state and form.
- Updated stops guidance text to clarify lat/lng are auto-calculated.
- Replaced editable miles input with read-only auto miles display.
- Added live miles estimation:
  - Debounced API call based on stop data.
  - Loading state: "Calculating..."
  - Error and guidance messaging.
- Uses calculated miles in order notes if available.

File: `frontend/app/globals.css`

- Added `.field-hint` and `.field-hint.error` for miles status messaging.
- Included modal scroll/layout fixes to ensure body scroll works.

### 2.4 Customer Picker

File: `frontend/components/CustomerSearchSelect.tsx`

- Reworked customer input into a dropdown (`<select>`).
- Loads customer list from API; no typing required to pick a customer.

File: `frontend/lib/api.ts`

- `searchCustomers(query = "")` now supports empty query.
- Added miles estimation client helper:
  - `estimateOrderMiles(stops)`

## 3) Backend Changes

### 3.1 Geometry Service (Geocoding + Routing)

File: `backend/app/services/geometry.py`

- Added Nominatim geocoding support:
  - Endpoint: `https://nominatim.openstreetmap.org/search`
  - Query shape: `q=<location>&format=json&limit=1`
- Added OSRM route distance support:
  - Endpoint: `http://router.project-osrm.org/route/v1/driving/...`
  - Query shape: `overview=false`
- Added:
  - `enrich_stops_with_coordinates(stops)` to fill missing lat/lng.
  - OSRM miles conversion from meters to miles.
- `compute_total_miles` now:
  1. Tries OSRM driving distance.
  2. Falls back to haversine if OSRM is unavailable.

### 3.2 Orders Router

File: `backend/app/routers/orders.py`

- During `POST /orders` and `PUT /orders/{id}/stops`:
  - Enriches stops with coordinates if missing.
  - Recomputes route geometry and miles after enrichment.
- Added filters in `GET /orders`:
  - `available_date`
  - `time_window`
  - `pickup`
  - `delivery`
  - `equipment`
  - `shipper`
- Added miles estimation endpoint:
  - `POST /orders/estimate-miles`
  - Input: stops array
  - Output: `{ "total_miles": number | null }`

### 3.3 Order Schemas

Files:
- `backend/app/schemas/order.py`
- `backend/app/schemas/__init__.py`

Added:
- `OrderMilesEstimateRequest`
- `OrderMilesEstimateResponse`

### 3.4 Customers Router

File: `backend/app/routers/customers.py`

- `GET /customers` behavior adjusted:
  - Empty query returns ordered customer list.
  - Non-empty query returns filtered results by name.

## 4) API Contract Additions/Updates

### 4.1 Estimate Miles API

Endpoint:

- `POST /orders/estimate-miles`

Example request:

```json
{
  "stops": [
    { "stop_type": "pickup", "city": "Cleveland", "state": "OH", "sequence": 1 },
    { "stop_type": "dropoff", "city": "Chicago", "state": "IL", "sequence": 2 }
  ]
}
```

Example response:

```json
{
  "total_miles": 352.71
}
```

### 4.2 Orders List Filters

Endpoint:

- `GET /orders`

Supported query parameters:

- `q`
- `page`
- `page_size`
- `available_date`
- `time_window` (`morning|afternoon|evening`)
- `pickup`
- `delivery`
- `equipment`
- `shipper` (`all|preferred|new`)

### 4.3 Customers List/Search

Endpoint:

- `GET /customers?query=...`

Behavior:

- Without `query` -> returns ordered customer list.
- With `query` -> returns matching customer names.

## 5) Runtime Flow for Auto Miles in Create Order

1. User fills stop city/state.
2. Frontend sends stops to `POST /orders/estimate-miles` (debounced).
3. Backend geocodes missing coordinates via Nominatim.
4. Backend computes route miles via OSRM (`overview=false`).
5. Frontend displays returned miles as read-only in Shipment step.
6. On final create, backend again enriches and computes authoritative geometry/miles.

## 6) Validation Performed

Frontend:

- `npm --prefix frontend run build` completed successfully after changes.

Backend:

- `python3 -m compileall backend/app` completed successfully after changes.

## 7) Notes / Tradeoffs

- External API dependencies:
  - Nominatim and OSRM availability and latency affect estimate response time.
- Geocoding quality depends on stop city/state/address quality.
- Backend keeps fallback behavior so order creation still works when OSRM is unavailable.
- Frontend miles field is read-only to avoid manual mismatch with route-calculated distance.
