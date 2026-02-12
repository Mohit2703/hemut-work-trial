"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in Next.js/SSR
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface OrderDetailsMapProps {
  routeGeometry: { type: string; coordinates: [number, number][] } | null;
  stops: { id: number; lat?: number | null; lng?: number | null; location_name?: string | null; sequence: number }[];
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length < 2) return;
    // coords are [lat, lng]
    map.fitBounds(coords, { padding: [40, 40] });
  }, [map, coords]);
  return null;
}

export default function OrderDetailsMap({ routeGeometry, stops }: OrderDetailsMapProps) {
  const polylinePositions: [number, number][] = useMemo(() => {
    if (!routeGeometry?.coordinates?.length) return [];
    return routeGeometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }, [routeGeometry]);

  const markersWithLatLng = useMemo(
    () =>
      stops
        .filter((s) => s.lat != null && s.lng != null)
        .sort((a, b) => a.sequence - b.sequence),
    [stops]
  );

  const center: [number, number] =
    polylinePositions.length > 0
      ? polylinePositions[Math.floor(polylinePositions.length / 2)]
      : [39.5, -98.5];
  const allCoords: [number, number][] = useMemo(
    () =>
      polylinePositions.length >= 2
        ? polylinePositions
        : markersWithLatLng.map((s) => [s.lat!, s.lng!]),
    [polylinePositions, markersWithLatLng]
  );

  return (
    <div style={{ height: 400, width: "100%", borderRadius: 8, overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allCoords.length >= 2 && <FitBounds coords={allCoords} />}
        {polylinePositions.length >= 2 && (
          <Polyline positions={polylinePositions} color="#1976d2" weight={4} />
        )}
        {markersWithLatLng.map((s) => (
          <Marker key={s.id} position={[s.lat!, s.lng!]}>
            <Popup>
              #{s.sequence} {s.location_name || "Stop"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
