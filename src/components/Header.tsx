import { Moon, Sun } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { settings, toggleTheme } = useSettings();

  return (
    <header className="top-header">
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--color-text)', lineHeight: 1.2 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{subtitle}</div>
        )}
      </div>
      <button
        className="btn btn-ghost"
        onClick={toggleTheme}
        style={{ minHeight: 36, padding: '6px 10px' }}
        aria-label="Zmień motyw"
      >
        {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
}
