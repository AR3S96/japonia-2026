import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, Clock, MapPin, FileText } from 'lucide-react';
import { Header } from '../../components/Header';
import { useTrip } from '../../context/TripContext';
import type { Activity, ActivityCategory } from '../../types';
import { ACTIVITY_CATEGORIES } from '../../lib/constants';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { WishlistSection } from '../../components/WishlistSection';

const LOCATION_LABELS: Record<string, string> = {
  tokyo: '🗼 Tokio',
  kyoto: '⛩️ Kioto',
  travel: '🚄 Przejazd',
};

export function PlannerPage() {
  const { days, dispatch } = useTrip();
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id ?? '');
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const selectedDay = days.find((d) => d.id === selectedDayId) ?? days[0];

  const handleToggle = (activityId: string) => {
    dispatch({ type: 'TOGGLE_ACTIVITY', dayId: selectedDay.id, activityId });
  };

  const handleDelete = (activityId: string) => {
    dispatch({ type: 'DELETE_ACTIVITY', dayId: selectedDay.id, activityId });
  };

  const handleSave = (data: Omit<Activity, 'id' | 'order'>) => {
    if (editActivity) {
      dispatch({ type: 'UPDATE_ACTIVITY', dayId: selectedDay.id, activity: { ...editActivity, ...data } });
    } else {
      dispatch({ type: 'ADD_ACTIVITY', dayId: selectedDay.id, activity: data });
    }
    setShowForm(false);
    setEditActivity(null);
  };

  const sortedActivities = [...(selectedDay?.activities ?? [])].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return a.order - b.order;
  });

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="Plan podróży"
        subtitle={selectedDay ? `${selectedDay.label} · ${LOCATION_LABELS[selectedDay.location]}` : ''}
      />

      {/* Day selector */}
      <div className="day-selector-bar" style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '10px 16px',
        scrollbarWidth: 'none',
      }}>
        {days.map((day) => {
          const date = new Date(day.date);
          const completed = day.activities.filter((a) => a.completed).length;
          const total = day.activities.length;
          return (
            <button
              key={day.id}
              className={`day-chip${selectedDayId === day.id ? ' active' : ''}`}
              onClick={() => setSelectedDayId(day.id)}
            >
              <span style={{ fontSize: 10, fontWeight: 500 }}>
                {format(date, 'EEE', { locale: pl }).toUpperCase()}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{format(date, 'd')}</span>
              {total > 0 && (
                <span style={{
                  fontSize: 10,
                  opacity: 0.8,
                  background: selectedDayId === day.id ? 'rgba(255,255,255,0.3)' : 'var(--color-border)',
                  padding: '1px 5px',
                  borderRadius: 10,
                }}>
                  {completed}/{total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Wishlist */}
        <WishlistSection />

        {/* Day header */}
        {selectedDay && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{selectedDay.label}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {format(new Date(selectedDay.date), 'EEEE, d MMMM yyyy', { locale: pl })}
              </div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => setNotesOpen(!notesOpen)}
              style={{ padding: '6px 10px', minHeight: 36 }}
            >
              <FileText size={16} />
              <span style={{ fontSize: 13 }}>Notatki</span>
            </button>
          </div>
        )}

        {/* Notes */}
        {notesOpen && selectedDay && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Notatki na ten dzień</div>
            <textarea
              className="input"
              value={selectedDay.notes}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_NOTES', dayId: selectedDay.id, notes: e.target.value })
              }
              placeholder="Dodaj notatki na ten dzień..."
              rows={3}
              style={{ resize: 'none' }}
            />
          </div>
        )}

        {/* Activities */}
        {sortedActivities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <div>Brak aktywności na ten dzień</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Dodaj pierwszą aktywność przyciskiem poniżej</div>
          </div>
        ) : (
          sortedActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onToggle={() => handleToggle(activity.id)}
              onEdit={() => { setEditActivity(activity); setShowForm(true); }}
              onDelete={() => handleDelete(activity.id)}
            />
          ))
        )}

        <button
          className="btn btn-primary"
          onClick={() => { setEditActivity(null); setShowForm(true); }}
          style={{ width: '100%', marginTop: 4 }}
        >
          <Plus size={18} />
          Dodaj aktywność
        </button>
      </div>

      {showForm && (
        <ActivityForm
          initial={editActivity}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditActivity(null); }}
        />
      )}
    </div>
  );
}

function ActivityItem({
  activity, onToggle, onEdit, onDelete,
}: {
  activity: Activity;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cat = ACTIVITY_CATEGORIES[activity.category];

  return (
    <div className="activity-item" style={{ opacity: activity.completed ? 0.6 : 1 }}>
      <button onClick={onToggle} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
        {activity.completed
          ? <CheckCircle size={22} color="var(--color-primary)" />
          : <Circle size={22} color="var(--color-border)" />
        }
      </button>
      <div style={{ flex: 1, minWidth: 0 }} onClick={onEdit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 15, textDecoration: activity.completed ? 'line-through' : 'none' }}>
            {activity.title}
          </span>
          <span style={{
            background: cat.color + '22',
            color: cat.color,
            padding: '1px 7px',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 600,
          }}>
            {cat.emoji} {cat.label}
          </span>
        </div>
        {activity.time && (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Clock size={12} /> {activity.time}
            {activity.location && <><MapPin size={12} style={{ marginLeft: 6 }} />{activity.location}</>}
          </div>
        )}
        {activity.description && (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 3 }}>
            {activity.description}
          </div>
        )}
      </div>
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', flexShrink: 0, color: 'var(--color-text-muted)' }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function ActivityForm({
  initial,
  onSave,
  onClose,
}: {
  initial: Activity | null;
  onSave: (data: Omit<Activity, 'id' | 'order'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    time: initial?.time ?? '',
    description: initial?.description ?? '',
    location: initial?.location ?? '',
    category: initial?.category ?? ('zwiedzanie' as ActivityCategory),
    completed: initial?.completed ?? false,
  });

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
          {initial ? 'Edytuj aktywność' : 'Dodaj aktywność'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Nazwa *</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="np. Senso-ji – świątynia Asakusa" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Godzina</label>
              <input className="input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Kategoria</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {Object.entries(ACTIVITY_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Lokalizacja</label>
            <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="np. Asakusa, Tokio" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Opis</label>
            <textarea className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Opcjonalne notatki..." rows={2} style={{ resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Anuluj</button>
            <button
              className="btn btn-primary"
              onClick={() => form.title.trim() && onSave(form)}
              style={{ flex: 1 }}
              disabled={!form.title.trim()}
            >
              {initial ? 'Zapisz' : 'Dodaj'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
