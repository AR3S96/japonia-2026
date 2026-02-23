import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ACTIVITY_CATEGORIES } from '../../lib/constants';
import type { ActivityCategory } from '../../types';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createColorMarker(color: string, emoji: string, completed: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 32px; height: 32px;
      background: ${completed ? '#888' : color};
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><span style="transform: rotate(45deg); font-size: 14px;">${emoji}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface MarkerData {
  id: string;
  title: string;
  category: ActivityCategory;
  coordinates: [number, number];
  completed: boolean;
  dayLabel: string;
}

interface MapViewProps {
  center: [number, number];
  zoom: number;
  markers: MarkerData[];
}

export default function MapView({ center, zoom, markers }: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={zoom} />
      {markers.map((m) => {
        const cat = ACTIVITY_CATEGORIES[m.category];
        return (
          <Marker
            key={m.id}
            position={m.coordinates}
            icon={createColorMarker(cat.color, cat.emoji, m.completed)}
          >
            <Popup>
              <div style={{ fontFamily: 'sans-serif', minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{m.dayLabel}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <span style={{
                    background: cat.color + '22',
                    color: cat.color,
                    padding: '1px 6px',
                    borderRadius: 100,
                    fontWeight: 600,
                  }}>
                    {cat.emoji} {cat.label}
                  </span>
                  {m.completed && <span style={{ marginLeft: 6, color: '#059669' }}>✓ Zaliczone</span>}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
