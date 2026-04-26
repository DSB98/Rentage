'use client';

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';

type ListingLocationMapProps = {
  latitude?: number | null;
  longitude?: number | null;
  onChange?: (next: { latitude: number; longitude: number }) => void;
  interactive?: boolean;
  className?: string;
  markerLabel?: string;
};

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

function ClickHandler({
  interactive,
  onChange,
}: {
  interactive: boolean;
  onChange?: (next: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      if (!interactive || !onChange) return;
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export default function ListingLocationMap({
  latitude,
  longitude,
  onChange,
  interactive = false,
  className,
  markerLabel,
}: ListingLocationMapProps) {
  const hasCoordinates =
    typeof latitude === 'number' && typeof longitude === 'number';

  const center = useMemo<[number, number]>(() => {
    if (hasCoordinates) return [latitude as number, longitude as number];
    return INDIA_CENTER;
  }, [hasCoordinates, latitude, longitude]);

  return (
    <div className={className || 'h-72 w-full overflow-hidden rounded-xl border border-slate-200'}>
      <MapContainer
        center={center}
        zoom={hasCoordinates ? 15 : 5}
        scrollWheelZoom={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeView center={center} />
        <ClickHandler interactive={interactive} onChange={onChange} />

        {hasCoordinates && (
          <Marker position={[latitude as number, longitude as number]} icon={markerIcon}>
            <Popup>
              {markerLabel || 'Selected location'}
              <br />
              {(latitude as number).toFixed(6)}, {(longitude as number).toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
