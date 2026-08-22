import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngLiteral, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { color, radius } from 'q-wash-shared';

// No lat/lng picker exists anywhere in the platform yet (checked q-wash's
// pubspec.yaml too) — Leaflet + CARTO's keyless dark tiles, approved with
// the user rather than plain lat/lng number inputs, see
// q-wash-admin/PLAN.md's "Update 2026-08-22" wizard-scope entry.
const DUSHANBE_CENTER: LatLngLiteral = { lat: 38.5598, lng: 68.787 };

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:${color.gold};border:3px solid #171317;box-shadow:0 0 0 1px rgba(217,178,106,.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export interface LocationPickerProps {
  value: LatLngLiteral | null;
  onChange: (value: LatLngLiteral) => void;
}

function ClickHandler({ onChange }: { onChange: (v: LatLngLiteral) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onChange(e.latlng);
    },
  });
  return null;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          height: 180,
          borderRadius: radius.lg,
          overflow: 'hidden',
          border: `1px solid ${color.borderStrong}`,
        }}
      >
        <MapContainer
          center={value ?? DUSHANBE_CENTER}
          zoom={value ? 15 : 12}
          style={{ height: '100%', width: '100%', background: color.input }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <ClickHandler onChange={onChange} />
          {value && (
            <Marker
              position={value}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => onChange(e.target.getLatLng()),
              }}
            />
          )}
        </MapContainer>
      </div>
      <div style={{ color: color.textFaint, fontSize: 11 }}>
        {value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'Нажмите на карту, чтобы указать точку'}
        {' · © OpenStreetMap contributors © CARTO'}
      </div>
    </div>
  );
}
