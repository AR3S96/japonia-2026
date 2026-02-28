import { useRef, useState, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, MessageCircle, Wallet, Package } from 'lucide-react';

const navItems = [
  { to: '/',          label: 'Główna',   Icon: Home },
  { to: '/plan',      label: 'Plan',     Icon: Calendar },
  { to: '/rozmowki',  label: 'Rozmówki', Icon: MessageCircle },
  { to: '/budzet',    label: 'Budżet',   Icon: Wallet },
  { to: '/bagaz',     label: 'Bagaż',    Icon: Package },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);

  // Indeks aktywnej strony
  const activeIndex = navItems.findIndex(({ to }) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  );

  // Stan dragu — "preview" indeksu pod palcem
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);

  const getIndexFromX = useCallback((clientX: number): number => {
    if (!navRef.current) return activeIndex;
    const rect = navRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const itemW = rect.width / navItems.length;
    return Math.max(0, Math.min(navItems.length - 1, Math.floor(relX / itemW)));
  }, [activeIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = false;
    setDragIndex(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - startX.current);
    if (dx > 8) {
      isDragging.current = true;
    }
    if (!isDragging.current) return;

    const idx = getIndexFromX(e.touches[0].clientX);
    setDragIndex(idx);

    // Natychmiastowa nawigacja (iOS 26 style)
    if (idx !== activeIndex) {
      navigate(navItems[idx].to);
    }
  }, [activeIndex, navigate, getIndexFromX]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current && dragIndex !== null) {
      navigate(navItems[dragIndex].to);
    }
    setDragIndex(null);
    isDragging.current = false;
  }, [dragIndex, navigate]);

  // Użyj dragIndex jeśli w trakcie przeciągania, inaczej aktywny z routera
  const visibleIndex = dragIndex !== null ? dragIndex : activeIndex;

  // Pozycja sliding indicator
  const count = navItems.length;
  const indicatorLeft = visibleIndex >= 0
    ? `calc(${(visibleIndex + 0.5) / count * 100}% - 16px)`
    : '-100px';

  return (
    <nav
      ref={navRef}
      className="bottom-nav"
      style={{ display: 'flex' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="nav-indicator"
        style={{
          left: indicatorLeft,
          // Podczas dragu — brak transition (instant follow), potem spring
          transition: dragIndex !== null ? 'none' : 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
      {navItems.map(({ to, label, Icon }, idx) => {
        const isActive = idx === (dragIndex !== null ? dragIndex : activeIndex);
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive: routerActive }) =>
              `nav-item${(dragIndex !== null ? idx === dragIndex : routerActive) ? ' active' : ''}`
            }
            style={{
              // Podczas dragu — lekkie powiększenie aktywnej ikony
              transform: dragIndex !== null && idx === dragIndex ? 'scale(1.12)' : 'scale(1)',
              transition: 'transform 0.1s ease',
            }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
