import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

export function SwipeableItem({ children, onDelete }: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const THRESHOLD = 72;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (isHorizontal.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;
    e.preventDefault();
    setOffset(Math.min(0, dx));
    setSwiping(true);
  };

  const handleTouchEnd = () => {
    setOffset((prev) => (prev < -THRESHOLD ? -THRESHOLD : 0));
    setSwiping(false);
  };

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        onClick={() => { onDelete(); setOffset(0); }}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: THRESHOLD,
          background: '#DC2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '0 12px 12px 0',
        }}
      >
        <Trash2 size={20} color="white" />
      </div>
      <div style={{
        transform: `translateX(${offset}px)`,
        transition: swiping ? 'none' : 'transform 0.25s ease',
        position: 'relative',
        zIndex: 1,
        /* solidne tło blokuje prześwit czerwonego panelu przez półprzezroczyste dzieci */
        background: 'var(--color-card-solid)',
      }}>
        {children}
      </div>
    </div>
  );
}
