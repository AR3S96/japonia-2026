import { useState, lazy, Suspense } from 'react';
import { Header } from '../../components/Header';
import { useTrip } from '../../context/TripContext';

const MapView = lazy(() => import('./MapView'));

const CITY_PRESETS = {
  tokyo: { center: [35.6762, 139.6503] as [number, number], zoom: 12, label: '🗼 Tokio' },
  kyoto: { center: [35.0116, 135.7681] as [number, number], zoom: 12, label: '⛩️ Kioto' },
};

export function MapPage() {
  const { days } = useTrip();
  const [city, setCity] = useState<'tokyo' | 'kyoto'>('tokyo');

  const markers = days.flatMap((day) =>
    day.activities
      .filter((a) => a.coordinates)
      .map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        coordinates: a.coordinates!,
        completed: a.completed,
        dayLabel: day.label,
      }))
  );

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Mapa miejsc" subtitle={`${markers.length} zaplanowanych miejsc`} />

      {/* City toggle */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '10px 16px',
        background: 'var(--color-nav)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        {(Object.entries(CITY_PRESETS) as [keyof typeof CITY_PRESETS, typeof CITY_PRESETS[keyof typeof CITY_PRESETS]][]).map(([key, preset]) => (
          <button
            key={key}
            className={`btn ${city === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCity(key)}
            style={{ flex: 1 }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
            Ładowanie mapy...
          </div>
        }>
          <div style={{ position: 'absolute', inset: 0, paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
            <MapView
              center={CITY_PRESETS[city].center}
              zoom={CITY_PRESETS[city].zoom}
              markers={markers}
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
