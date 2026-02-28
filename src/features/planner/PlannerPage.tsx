import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CheckCircle, Circle, Clock, MapPin, FileText, Search, X } from 'lucide-react';
import { Header } from '../../components/Header';
import { SwipeableItem } from '../../components/SwipeableItem';
import { useTrip } from '../../context/TripContext';
import type { Activity, ActivityCategory } from '../../types';
import { ACTIVITY_CATEGORIES, JP_WEEKDAYS } from '../../lib/constants';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { WishlistSection } from '../../components/WishlistSection';

const LOCATION_LABELS: Record<string, string> = {
  tokyo: '🗼 Tokio',
  kyoto: '⛩️ Kioto',
  travel: '🚄 Przejazd',
};

function TimelineView({ activities, onToggle, onEdit, onDelete, completingId }: {
  activities: Activity[];
  onToggle: (id: string) => void;
  onEdit: (a: Activity) => void;
  onDelete: (id: string) => void;
  completingId: string | null;
}) {
  return (
    <div style={{ position: 'relative', paddingLeft: 48 }}>
      {/* Pionowa linia */}
      <div style={{
        position: 'absolute', left: 18, top: 8, bottom: 8,
        width: 2,
        background: 'linear-gradient(to bottom, var(--color-primary), rgba(217,119,6,0.15))',
        borderRadius: 1,
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {activities.map((activity) => {
          const cat = ACTIVITY_CATEGORIES[activity.category];
          return (
            <div key={activity.id} style={{ position: 'relative', marginBottom: 8 }}>
              {/* Kropka na linii */}
              <div style={{
                position: 'absolute', left: -34, top: 14,
                width: 12, height: 12, borderRadius: '50%',
                background: activity.completed ? 'var(--color-primary)' : 'var(--color-card-solid)',
                border: `2px solid ${activity.completed ? 'var(--color-primary)' : cat.color}`,
                zIndex: 2,
                transition: 'background 0.2s, border-color 0.2s',
              }} />
              {/* Godzina nad kartą */}
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--color-primary)',
                marginBottom: 3, letterSpacing: 0.5,
              }}>
                {activity.time}
              </div>
              <SwipeableItem onDelete={() => onDelete(activity.id)}>
                <ActivityItem
                  activity={activity}
                  onToggle={() => onToggle(activity.id)}
                  onEdit={() => onEdit(activity)}
                  animating={completingId === activity.id}
                />
              </SwipeableItem>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlannerPage() {
  const { days, dispatch } = useTrip();
  const [selectedDayId, setSelectedDayId] = useState(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return days.find((day) => day.id === todayStr)?.id ?? days[0]?.id ?? '';
  });
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const daySelectorRef = useRef<HTMLDivElement>(null);

  const selectedDay = days.find((d) => d.id === selectedDayId) ?? days[0];

  // Auto-scroll wybranego dnia do centrum
  useEffect(() => {
    if (!daySelectorRef.current) return;
    const active = daySelectorRef.current.querySelector('.day-chip.active');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDayId]);

  const handleToggle = (activityId: string) => {
    dispatch({ type: 'TOGGLE_ACTIVITY', dayId: selectedDay.id, activityId });
    setCompletingId(activityId);
    setTimeout(() => setCompletingId(null), 500);
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

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = isSearching
    ? days.flatMap((day) => {
        const q = searchQuery.toLowerCase();
        const matched = day.activities.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            (a.description ?? '').toLowerCase().includes(q) ||
            (a.location ?? '').toLowerCase().includes(q)
        );
        return matched.length > 0 ? [{ day, activities: matched }] : [];
      })
    : [];

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header
        title="Plan podróży"
        subtitle={selectedDay ? `${selectedDay.label} · ${LOCATION_LABELS[selectedDay.location]}` : ''}
      />

      {/* Day selector */}
      <div ref={daySelectorRef} className="day-selector-bar day-selector-snap" style={{
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
          const allDone = total > 0 && completed === total;
          const jpDay = JP_WEEKDAYS[date.getDay()];
          return (
            <button
              key={day.id}
              className={`day-chip${selectedDayId === day.id ? ' active' : ''}${allDone ? ' day-complete' : ''}`}
              onClick={() => setSelectedDayId(day.id)}
            >
              <span style={{ fontSize: 10, fontWeight: 500 }}>
                {format(date, 'EEE', { locale: pl }).toUpperCase()}
              </span>
              <span className="jp-weekday">{jpDay}</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{format(date, 'd')}</span>
              {allDone ? (
                <span className="hanko-stamp">済</span>
              ) : (
                <span style={{
                  fontSize: 10,
                  opacity: total === 0 ? 0.4 : 0.9,
                  background: selectedDayId === day.id ? 'rgba(255,255,255,0.3)' : 'var(--color-border)',
                  padding: '1px 5px',
                  borderRadius: 10,
                  minWidth: 16,
                  textAlign: 'center',
                }}>
                  {total === 0 ? '·' : `${completed}/${total}`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Wyszukiwarka */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }} />
          <input
            className="input"
            placeholder="Szukaj aktywności..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 36, paddingRight: searchQuery ? 36 : 12 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', padding: 4,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tryb wyszukiwania */}
        {isSearching ? (
          searchResults.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div>Brak wyników dla „{searchQuery}"</div>
            </div>
          ) : (
            searchResults.map(({ day, activities }) => (
              <div key={day.id}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
                  padding: '4px 2px 6px', textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {day.label} · {format(new Date(day.date), 'd MMM', { locale: pl })}
                </div>
                {activities.map((activity) => (
                  <SwipeableItem
                    key={activity.id}
                    onDelete={() => dispatch({ type: 'DELETE_ACTIVITY', dayId: day.id, activityId: activity.id })}
                  >
                    <ActivityItem
                      activity={activity}
                      onToggle={() => dispatch({ type: 'TOGGLE_ACTIVITY', dayId: day.id, activityId: activity.id })}
                      onEdit={() => { setSelectedDayId(day.id); setEditActivity(activity); setShowForm(true); }}
                    />
                  </SwipeableItem>
                ))}
              </div>
            ))
          )
        ) : (
          <>
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
                <div className="enso-circle" />
                <div style={{ fontWeight: 600 }}>Pusty dzień</div>
                <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
                  Pusty dzień to przestrzeń na możliwości.<br/>
                  Dodaj pierwszą aktywność poniżej.
                </div>
              </div>
            ) : (
              (() => {
                const withTime = sortedActivities.filter((a) => a.time);
                const withoutTime = sortedActivities.filter((a) => !a.time);
                return (
                  <>
                    {withTime.length > 0 && (
                      <TimelineView
                        activities={withTime}
                        onToggle={handleToggle}
                        onEdit={(a) => { setEditActivity(a); setShowForm(true); }}
                        onDelete={handleDelete}
                        completingId={completingId}
                      />
                    )}
                    {withoutTime.length > 0 && (
                      <>
                        {withTime.length > 0 && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, padding: '4px 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Bez godziny
                          </div>
                        )}
                        {withoutTime.map((activity) => (
                          <SwipeableItem
                            key={activity.id}
                            onDelete={() => handleDelete(activity.id)}
                          >
                            <ActivityItem
                              activity={activity}
                              onToggle={() => handleToggle(activity.id)}
                              onEdit={() => { setEditActivity(activity); setShowForm(true); }}
                              animating={completingId === activity.id}
                            />
                          </SwipeableItem>
                        ))}
                      </>
                    )}
                  </>
                );
              })()
            )}

            <button
              className="btn btn-primary"
              onClick={() => { setEditActivity(null); setShowForm(true); }}
              style={{ width: '100%', marginTop: 4 }}
            >
              <Plus size={18} />
              Dodaj aktywność
            </button>
          </>
        )}
      </div>

      {showForm && createPortal(
        <ActivityForm
          initial={editActivity}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditActivity(null); }}
        />,
        document.body
      )}
    </div>
  );
}

function ActivityItem({
  activity, onToggle, onEdit, animating,
}: {
  activity: Activity;
  onToggle: () => void;
  onEdit: () => void;
  animating?: boolean;
}) {
  const cat = ACTIVITY_CATEGORIES[activity.category];

  return (
    <div className={`activity-item${animating ? ' complete-pulse' : ''}`} style={{ opacity: activity.completed ? 0.6 : 1 }}>
      <button onClick={onToggle} className={animating ? 'check-pop' : ''} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
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
