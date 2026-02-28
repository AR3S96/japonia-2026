import { useState, useEffect, useRef } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { Header } from '../../components/Header';
import { SkeletonProgress, SkeletonList } from '../../components/Skeleton';
import { SwipeableItem } from '../../components/SwipeableItem';
import { usePacking } from '../../context/PackingContext';
import { useToast } from '../../context/ToastContext';
import type { PackingCategory } from '../../types';

const CATEGORIES: Record<PackingCategory, { label: string; emoji: string; color: string }> = {
  dokumenty:   { label: 'Dokumenty',   emoji: '📄', color: '#3B82F6' },
  elektronika: { label: 'Elektronika', emoji: '🔌', color: '#8B5CF6' },
  ubrania:     { label: 'Ubrania',     emoji: '👕', color: '#F59E0B' },
  kosmetyki:   { label: 'Kosmetyki',   emoji: '🧴', color: '#10B981' },
  inne:        { label: 'Inne',        emoji: '📦', color: '#6B7280' },
};

const CAT_ORDER: PackingCategory[] = ['dokumenty', 'elektronika', 'ubrania', 'kosmetyki', 'inne'];

export function PackingPage() {
  const { items, dispatch, loading } = usePacking();
  const { showToast } = useToast();
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<PackingCategory>('inne');
  const [showAdd, setShowAdd] = useState(false);
  const [flashingCat, setFlashingCat] = useState<string | null>(null);
  const [justToggled, setJustToggled] = useState<string | null>(null);
  const prevPctRef = useRef(0);

  const packed = items.filter((i) => i.packed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;

  // Celebracja 100% pakowania
  useEffect(() => {
    if (pct === 100 && prevPctRef.current < 100 && total > 0) {
      showToast('Gotowe! Wszystko spakowane na Japonię! 🎌', 'success');
    }
    prevPctRef.current = pct;
  }, [pct, total, showToast]);

  const byCategory = CAT_ORDER.map((cat) => ({
    cat,
    meta: CATEGORIES[cat],
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  const handleToggle = (itemId: string, category: string) => {
    dispatch({ type: 'TOGGLE_ITEM', id: itemId });
    setJustToggled(itemId);
    setTimeout(() => setJustToggled(null), 350);

    // Sprawdź czy kategoria będzie 100% po toggle
    const catItems = items.filter((i) => i.category === category);
    const targetItem = catItems.find((i) => i.id === itemId);
    if (!targetItem) return;
    const packedAfter = catItems.filter((i) => i.id === itemId ? !i.packed : i.packed).length;
    if (packedAfter === catItems.length) {
      setFlashingCat(category);
      setTimeout(() => setFlashingCat(null), 650);
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    dispatch({ type: 'ADD_ITEM', name: newName.trim(), category: newCat });
    setNewName('');
    setShowAdd(false);
  };

  if (loading) return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Lista bagażu" subtitle="Ładowanie..." />
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonProgress />
        <SkeletonList count={4} />
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Lista bagażu" subtitle={`${packed}/${total} spakowane`} />
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Pasek postępu */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>
              {pct === 100 ? '✅ Wszystko spakowane!' : 'Postęp pakowania'}
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{
              width: `${pct}%`,
              background: pct === 100 ? '#059669' : 'var(--color-primary)',
            }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {packed} z {total} rzeczy spakowane
          </div>
        </div>

        {/* Grupy kategorii */}
        {byCategory.map(({ cat, meta, items: catItems }) => {
          const catPacked = catItems.filter((i) => i.packed).length;
          return (
            <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                {/* Kolorowy pasek boczny */}
                <div style={{ width: 4, background: meta.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  {/* Nagłówek kategorii */}
                  <div className={flashingCat === cat ? 'category-complete-flash' : ''} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {meta.emoji} {meta.label}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: catPacked === catItems.length ? meta.color : 'var(--color-text-muted)',
                      fontWeight: catPacked === catItems.length ? 700 : 400,
                      transition: 'color 0.2s',
                    }}>
                      {catPacked === catItems.length && catItems.length > 0 ? '✓ ' : ''}{catPacked}/{catItems.length}
                    </span>
                  </div>
                  {/* Lista itemów */}
                  {catItems.map((item, idx) => (
                    <SwipeableItem
                      key={item.id}
                      onDelete={() => dispatch({ type: 'DELETE_ITEM', id: item.id })}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px',
                        borderBottom: idx < catItems.length - 1 ? '1px solid var(--color-border)' : 'none',
                        opacity: item.packed ? 0.55 : 1,
                        transition: 'opacity 0.15s',
                        background: 'var(--color-card-solid)',
                      }}>
                        <button
                          onClick={() => handleToggle(item.id, cat)}
                          className={justToggled === item.id ? 'check-pop' : ''}
                          style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            border: `2px solid ${item.packed ? 'var(--color-primary)' : 'var(--color-border-solid)'}`,
                            background: item.packed ? 'var(--color-primary)' : 'transparent',
                            cursor: 'pointer', padding: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {item.packed && <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span>}
                        </button>
                        <span style={{
                          flex: 1, fontSize: 14,
                          textDecoration: item.packed ? 'line-through' : 'none',
                        }}>
                          {item.name}
                        </span>
                      </div>
                    </SwipeableItem>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Formularz dodawania */}
        {showAdd ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="input"
              placeholder="Nazwa rzeczy..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            <select
              className="input"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as PackingCategory)}
            >
              {CAT_ORDER.map((c) => (
                <option key={c} value={c}>{CATEGORIES[c].emoji} {CATEGORIES[c].label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>
                Anuluj
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={!newName.trim()}
                style={{ flex: 1 }}
              >
                Dodaj
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowAdd(true)}
              style={{ flex: 1 }}
            >
              <Plus size={18} /> Dodaj rzecz
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'RESET_ALL' })}
              title="Odznacz wszystkie"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
