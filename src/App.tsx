import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { SyncProvider } from './context/SyncContext';
import { TripProvider } from './context/TripContext';
import { BudgetProvider } from './context/BudgetContext';
import { PackingProvider } from './context/PackingContext';
import { BottomNav } from './components/BottomNav';
import { AnimatedRoutes } from './components/AnimatedRoutes';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PlannerPage } from './features/planner/PlannerPage';
import { PhrasebookPage } from './features/phrasebook/PhrasebookPage';
import { BudgetPage } from './features/budget/BudgetPage';
import { InfoPage } from './features/info/InfoPage';
import { MapPage } from './features/map/MapPage';
import { PackingPage } from './features/packing/PackingPage';

export default function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <SyncProvider>
          <TripProvider>
            <BudgetProvider>
              <PackingProvider>
                <HashRouter>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-bg)', overflow: 'hidden' }}>
                    <AnimatedRoutes>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/plan" element={<PlannerPage />} />
                        <Route path="/rozmowki" element={<PhrasebookPage />} />
                        <Route path="/budzet" element={<BudgetPage />} />
                        <Route path="/info" element={<InfoPage />} />
                        <Route path="/mapa" element={<MapPage />} />
                        <Route path="/bagaz" element={<PackingPage />} />
                      </Routes>
                    </AnimatedRoutes>
                    <BottomNav />
                  </div>
                </HashRouter>
              </PackingProvider>
            </BudgetProvider>
          </TripProvider>
        </SyncProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
