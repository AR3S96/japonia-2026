import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, ArrowRight, MapPin } from 'lucide-react';
import { useTrip } from '../context/TripContext';
import type { ActivityCategory, WishlistItem } from '../types';
import { ACTIVITY_CATEGORIES } from '../lib/constants';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const CATEGORY_KEYS = Object.keys(ACTIVITY_CATEGORIES) as ActivityCategory[];

export function WishlistSection() {
  const { wishlist, days, dispatch } = useTrip();
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  if (wishlist.length === 0 && !showForm && !isOpen) {
    return (
      <button
        className="btn btn-ghost"
        onClick={() => { setIsOpen(true); setShowForm(true); }}
        style={{ width: '100%', justifyContent: 'center', gap: 6, padding: '10px 16px', fontSize: 13 }}
      >
        <Plus size={16} />
        Dodaj do listy życzeń
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <button
        className="wishlist-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          color: 'var(--color-text)',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        📌 Chcę odwiedzić ({wishlist.length})
      </button>

      {isOpen && (
        <>
          {/* Wishlist items */}
          {wishlist.map((item) => (
            <div key={item.id} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</span>
                    <span style={{
                      background: ACTIVITY_CATEGORIES[item.category].color + '22',
                      color: ACTIVITY_CATEGORIES[item.category].color,
                      padding: '1px 7px',
                      borderRadius: 100,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {ACTIVITY_CATEGORIES[item.category].emoji} {ACTIVITY_CATEGORIES[item.category].label}
                    </span>
                  </div>
                  {item.location && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                      <MapPin size={11} /> {item.location}
                    </div>
                  )}
                  {item.description && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{item.description}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button
                    onClick={() => setMovingId(movingId === item.id ? null : item.id)}
                    title="Przenieś do dnia"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      color: movingId === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    <ArrowRight size={15} />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_WISHLIST_ITEM', id: item.id })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text-muted)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Day picker */}
              {movingId === item.id && (
                <div style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  paddingBottom: 2,
                }}>
                  {days.map((day) => {
                    const date = new Date(day.date);
                    return (
                      <button
                        key={day.id}
                        onClick={() => {
                          dispatch({ type: 'MOVE_TO_DAY', itemId: item.id, dayId: day.id });
                          setMovingId(null);
                        }}
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontSize: 12,
                          color: 'var(--color-text)',
                          fontWeight: 500,
                        }}
                      >
                        {format(date, 'EEE d', { locale: pl })}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Add button */}
          <button
            className="btn btn-ghost"
            onClick={() => setShowForm(true)}
            style={{ width: '100%', justifyContent: 'center', gap: 6, fontSize: 13 }}
          >
            <Plus size={16} />
            Dodaj miejsce
          </button>

          {/* Add form modal */}
          {showForm && (
            <WishlistForm
              onSave={(item) => {
                dispatch({ type: 'ADD_WISHLIST_ITEM', item });
                setShowForm(false);
              }}
              onClose={() => setShowForm(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

function WishlistForm({
  onSave,
  onClose,
}: {
  onSave: (item: Omit<WishlistItem, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    category: 'zwiedzanie' as ActivityCategory,
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Dodaj do listy życzeń</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Nazwa *</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="np. Fushimi Inari Taisha" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Kategoria</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORY_KEYS.map((k) => (
                  <option key={k} value={k}>{ACTIVITY_CATEGORIES[k].emoji} {ACTIVITY_CATEGORIES[k].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Lokalizacja</label>
              <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="np. Kioto" />
            </div>
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
              Dodaj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
