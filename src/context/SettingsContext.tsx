import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface Settings {
  theme: 'light' | 'dark';
}

const defaultSettings: Settings = { theme: 'light' };

interface SettingsContextValue {
  settings: Settings;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const s = localStorage.getItem('settings');
      return s ? JSON.parse(s) : defaultSettings;
    } catch { return defaultSettings; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const toggleTheme = () =>
    setSettings((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));

  return (
    <SettingsContext.Provider value={{ settings, toggleTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
