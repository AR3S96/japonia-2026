import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { TripProvider } from './context/TripContext';
import { BudgetProvider } from './context/BudgetContext';
import { BottomNav } from './components/BottomNav';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PlannerPage } from './features/planner/PlannerPage';
import { PhrasebookPage } from './features/phrasebook/PhrasebookPage';
import { BudgetPage } from './features/budget/BudgetPage';
import { InfoPage } from './features/info/InfoPage';
import { MapPage } from './features/map/MapPage';

export default function App() {
  return (
    <SettingsProvider>
      <TripProvider>
        <BudgetProvider>
          <HashRouter>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--color-bg)', overflow: 'hidden' }}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/plan" element={<PlannerPage />} />
                <Route path="/rozmowki" element={<PhrasebookPage />} />
                <Route path="/budzet" element={<BudgetPage />} />
                <Route path="/info" element={<InfoPage />} />
                <Route path="/mapa" element={<MapPage />} />
              </Routes>
              <BottomNav />
            </div>
          </HashRouter>
        </BudgetProvider>
      </TripProvider>
    </SettingsProvider>
  );
}
