"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";

export type MapPoint = { lat: number; lng: number };

export type MapViewProps = {
  center: MapPoint;
  marker?: MapPoint & { color?: string; label?: string };
  trail?: MapPoint[];
  fence?: { lat: number; lng: number; radius_m: number };
  zoom?: number;
  className?: string;
};

function pinIcon(color: string, label?: string) {
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `
      <div style="position:relative;width:34px;height:34px;display:grid;place-items:center">
        <span class="pulse-ring" style="position:absolute;inset:6px;border-radius:9999px"></span>
        <span style="
          width:16px;height:16px;border-radius:9999px;
          background:${color};border:3px solid #faf7f2;
          box-shadow:0 2px 10px rgba(20,17,15,.35);
          position:relative;z-index:2"></span>
        ${label ? `<span style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;color:#14110f;background:#faf7f2;padding:1px 6px;border-radius:99px;white-space:nowrap;border:1px solid #e2d8c8">${label}</span>` : ""}
      </div>`,
  });
}

function Recenter({ center, zoom }: { center: MapPoint; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export default function MapView({
  center,
  marker,
  trail,
  fence,
  zoom = 15,
  className,
}: MapViewProps) {
  const color = marker?.color ?? "#a8822a";

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className}
      style={{ height: "100%", width: "100%" }}
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {fence ? (
        <Circle
          center={[fence.lat, fence.lng]}
          radius={fence.radius_m}
          pathOptions={{
            color: "#a8822a",
            weight: 1.5,
            fillColor: "#a8822a",
            fillOpacity: 0.08,
            dashArray: "5 5",
          }}
        />
      ) : null}

      {trail && trail.length > 1 ? (
        <Polyline
          positions={trail.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{ color: "#a8822a", weight: 2, opacity: 0.55 }}
        />
      ) : null}

      {marker ? (
        <Marker
          position={[marker.lat, marker.lng]}
          icon={pinIcon(color, marker.label)}
        />
      ) : null}

      <Recenter center={center} zoom={zoom} />
    </MapContainer>
  );
}
