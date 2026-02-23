import { NavLink } from 'react-router-dom';
import { Home, Calendar, MessageCircle, Wallet, Info } from 'lucide-react';

const navItems = [
  { to: '/',          label: 'Główna',   Icon: Home },
  { to: '/plan',      label: 'Plan',     Icon: Calendar },
  { to: '/rozmowki',  label: 'Rozmówki', Icon: MessageCircle },
  { to: '/budzet',    label: 'Budżet',   Icon: Wallet },
  { to: '/info',      label: 'Info',     Icon: Info },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={22} strokeWidth={1.8} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
