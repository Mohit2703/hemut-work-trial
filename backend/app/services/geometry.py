"""
Geometry utilities for stop geocoding and route computation.

- Geocode missing coordinates using Nominatim.
- Compute driving miles using OSRM (fallback to Haversine).
"""
import math
from typing import Any, Iterable

import httpx

from app.models.stop import Stop

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
OSRM_ROUTE_URL = "http://router.project-osrm.org/route/v1/driving"
HTTP_TIMEOUT_SECONDS = 10.0
NOMINATIM_HEADERS = {
    "User-Agent": "freight-marketplace/1.0 (dispatch@local)",
}


def haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute distance in miles between two points using Haversine formula."""
    R = 3958.8  # Earth radius in miles
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def stops_to_linestring(stops: list[Stop]) -> dict[str, Any] | None:
    """
    Build GeoJSON LineString from stops ordered by sequence.
    Coordinates as [lng, lat] per GeoJSON convention.
    """
    sorted_stops = sorted(stops, key=lambda s: s.sequence)
    coordinates = [
        [s.lng, s.lat]
        for s in sorted_stops
        if s.lng is not None and s.lat is not None
    ]
    if not coordinates:
        return None
    return {"type": "LineString", "coordinates": coordinates}


def _build_geocode_queries(stop: Stop) -> list[str]:
    city_state = ", ".join(part for part in [stop.city, stop.state] if part)
    full_address = ", ".join(part for part in [stop.address, stop.city, stop.state, stop.zip] if part)
    named_location = ", ".join(part for part in [stop.location_name, stop.city, stop.state] if part)

    queries: list[str] = []
    for candidate in [city_state, full_address, named_location]:
        normalized = candidate.strip() if candidate else ""
        if normalized and normalized not in queries:
            queries.append(normalized)
    return queries


def _geocode_query(query: str, client: httpx.Client) -> tuple[float, float] | None:
    try:
        response = client.get(
            NOMINATIM_SEARCH_URL,
            params={"q": query, "format": "json", "limit": 1},
            headers=NOMINATIM_HEADERS,
        )
        response.raise_for_status()
        items = response.json()
    except Exception:
        return None

    if not items:
        return None

    first = items[0]
    try:
        lat = float(first["lat"])
        lng = float(first["lon"])
    except (KeyError, TypeError, ValueError):
        return None
    return (lat, lng)


def enrich_stops_with_coordinates(stops: Iterable[Stop]) -> None:
    """
    Fill missing stop lat/lng values using Nominatim.

    Uses city/state first, then fuller address strings.
    """
    sorted_stops = sorted(stops, key=lambda s: s.sequence)
    missing = [stop for stop in sorted_stops if stop.lat is None or stop.lng is None]
    if not missing:
        return

    try:
        with httpx.Client(timeout=HTTP_TIMEOUT_SECONDS) as client:
            for stop in missing:
                for query in _build_geocode_queries(stop):
                    coordinates = _geocode_query(query, client)
                    if coordinates is None:
                        continue
                    stop.lat, stop.lng = coordinates
                    break
    except Exception:
        # If external geocoding fails, keep existing values and continue.
        return


def _osrm_route_miles(stops: list[Stop], client: httpx.Client) -> float | None:
    coordinate_pairs = ";".join(f"{stop.lng},{stop.lat}" for stop in stops)
    route_url = f"{OSRM_ROUTE_URL}/{coordinate_pairs}"
    try:
        response = client.get(route_url, params={"overview": "false"})
        response.raise_for_status()
        payload = response.json()
    except Exception:
        return None

    if payload.get("code") != "Ok":
        return None
    routes = payload.get("routes")
    if not isinstance(routes, list) or not routes:
        return None

    distance_meters = routes[0].get("distance")
    if not isinstance(distance_meters, (int, float)):
        return None

    return float(distance_meters) * 0.000621371


def compute_total_miles(stops: list[Stop]) -> float | None:
    """
    Compute total route miles from stops ordered by sequence.

    Prefers OSRM driving distance and falls back to Haversine when unavailable.
    """
    sorted_stops = sorted(stops, key=lambda s: s.sequence)
    valid = [s for s in sorted_stops if s.lat is not None and s.lng is not None]
    if len(valid) < 2:
        return None

    try:
        with httpx.Client(timeout=HTTP_TIMEOUT_SECONDS) as client:
            osrm_miles = _osrm_route_miles(valid, client)
        if osrm_miles is not None:
            return round(osrm_miles, 2)
    except Exception:
        pass

    total = 0.0
    for i in range(len(valid) - 1):
        total += haversine_miles(
            valid[i].lat, valid[i].lng,
            valid[i + 1].lat, valid[i + 1].lng,
        )
    return round(total, 2)
