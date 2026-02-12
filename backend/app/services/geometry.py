"""
Geometry utilities for route computation.
Builds GeoJSON LineString from stops and computes total miles (Haversine).
"""
import math
from typing import Any

from app.models.stop import Stop


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


def compute_total_miles(stops: list[Stop]) -> float | None:
    """Compute total miles from stops ordered by sequence (sum of segment distances)."""
    sorted_stops = sorted(stops, key=lambda s: s.sequence)
    valid = [s for s in sorted_stops if s.lat is not None and s.lng is not None]
    if len(valid) < 2:
        return None
    total = 0.0
    for i in range(len(valid) - 1):
        total += haversine_miles(
            valid[i].lat, valid[i].lng,
            valid[i + 1].lat, valid[i + 1].lng,
        )
    return round(total, 2)
