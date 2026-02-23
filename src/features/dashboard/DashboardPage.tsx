import { useState } from 'react';
import { differenceInDays, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, MessageCircle, Wallet, Map, Info, CheckCircle2, Share2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useTrip } from '../../context/TripContext';
import { useBudget } from '../../context/BudgetContext';
import { TRIP_START, TRIP_END } from '../../lib/constants';
import { exportAllData, parseImport, copyToClipboard, downloadJson } from '../../lib/tripExport';

export function DashboardPage() {
  const navigate = useNavigate();
  const { days, wishlist, dispatch } = useTrip();
  const { state, dispatch: budgetDispatch } = useBudget();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripStart = new Date(TRIP_START);
  tripStart.setHours(0, 0, 0, 0);
  const tripEnd = new Date(TRIP_END);
  tripEnd.setHours(23, 59, 59, 999);

  const isBeforeTrip = today < tripStart;
  const isDuringTrip = today >= tripStart && today <= tripEnd;
  const isAfterTrip = today > tripEnd;

  const daysUntil = differenceInDays(tripStart, today);
  const currentDayNum = isDuringTrip ? differenceInDays(today, tripStart) + 1 : null;

  const totalActivities = days.reduce((s, d) => s + d.activities.length, 0);
  const completedActivities = days.reduce((s, d) => s + d.activities.filter((a) => a.completed).length, 0);
  const progressPct = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const totalSpentPLN = state.expenses.reduce((s, e) => s + e.amountPLN, 0);
  const remainingPLN = state.budget - totalSpentPLN;

  const handleExport = async () => {
    const json = exportAllData(days, wishlist, state);
    const ok = await copyToClipboard(json);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const json = exportAllData(days, wishlist, state);
    downloadJson(json);
  };

  const handleImport = () => {
    const data = parseImport(importText);
    if (!data) {
      setImportError('Nieprawidłowy format danych. Sprawdź czy wklejony JSON jest poprawny.');
      return;
    }
    dispatch({ type: 'IMPORT_DATA', days: data.days, wishlist: data.wishlist });
    budgetDispatch({ type: 'IMPORT_BUDGET', state: data.budget });
    setShowImportModal(false);
    setImportText('');
    setImportError('');
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Japonia 2026 🇯🇵" subtitle="Asystent Podróży" />
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Countdown card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #D97706 0%, #DC2626 100%)',
          border: 'none',
          color: 'white',
          textAlign: 'center',
          padding: '24px 16px',
        }}>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            5–18 listopada 2026 · Tokio & Kioto
          </div>
          {isBeforeTrip && (
            <>
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{daysUntil}</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                {daysUntil === 1 ? 'dzień do wyjazdu' : daysUntil < 5 ? 'dni do wyjazdu' : 'dni do wyjazdu'}
              </div>
            </>
          )}
          {isDuringTrip && (
            <>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>Dzień {currentDayNum}/14</div>
              <div style={{ fontSize: 16, marginTop: 4, opacity: 0.9 }}>
                {format(today, 'EEEE, d MMMM', { locale: pl })}
              </div>
            </>
          )}
          {isAfterTrip && (
            <>
              <div style={{ fontSize: 36, fontWeight: 800 }}>またね！</div>
              <div style={{ fontSize: 16, marginTop: 4 }}>Mata ne! Do następnego razu, Japonii 🙏</div>
            </>
          )}
          <div style={{ marginTop: 12, fontSize: 24 }}>🍁 ⛩️ 🗾</div>
        </div>

        {/* Progress */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="var(--color-primary)" />
              Postęp wycieczki
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {completedActivities}/{totalActivities} aktywności
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, textAlign: 'right' }}>
            {progressPct}% ukończone
          </div>
        </div>

        {/* Wishlist count */}
        {wishlist.length > 0 && (
          <div className="card" onClick={() => navigate('/plan')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                📌 Chcę odwiedzić
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>
                {wishlist.length}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {wishlist.length === 1 ? '1 miejsce' : `${wishlist.length} miejsc`} do zaplanowania
            </div>
          </div>
        )}

        {/* Weather info */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            ☁️ Pogoda w listopadzie
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { city: '🗼 Tokio', temp: '8–17°C', desc: 'Słonecznie, sucho' },
              { city: '⛩️ Kioto', temp: '6–15°C', desc: 'Chłodniej wieczorem' },
            ].map((w) => (
              <div key={w.city} style={{
                background: 'var(--color-bg)',
                borderRadius: 10,
                padding: '10px 12px',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{w.city}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', margin: '2px 0' }}>{w.temp}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{w.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
            🍁 Szczyt sezonu momiji – idealna pora roku!
          </div>
        </div>

        {/* Budget summary */}
        {state.expenses.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              💰 Budżet
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Wydano</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent)' }}>
                  {totalSpentPLN.toFixed(0)} zł
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Pozostało</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: remainingPLN >= 0 ? '#059669' : '#DC2626' }}>
                  {remainingPLN.toFixed(0)} zł
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)', paddingLeft: 2 }}>
          SZYBKI DOSTĘP
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { icon: <Calendar size={22} />, label: 'Plan', to: '/plan' },
            { icon: <MessageCircle size={22} />, label: 'Rozmówki', to: '/rozmowki' },
            { icon: <Wallet size={22} />, label: 'Budżet', to: '/budzet' },
            { icon: <Map size={22} />, label: 'Mapa', to: '/mapa' },
            { icon: <Info size={22} />, label: 'Info', to: '/info' },
            { icon: <span style={{ fontSize: 22 }}>⛩️</span>, label: 'Etykieta', to: '/info' },
          ].map((item) => (
            <button
              key={item.label}
              className="card btn"
              onClick={() => navigate(item.to)}
              style={{
                flexDirection: 'column',
                gap: 6,
                padding: '14px 8px',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: 12,
                border: '1px solid var(--color-border)',
              }}
            >
              {item.icon}
              <span style={{ color: 'var(--color-text)' }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Share / Import */}
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)', paddingLeft: 2, marginTop: 4 }}>
          UDOSTĘPNIANIE DANYCH
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            className="card btn"
            onClick={() => setShowShareModal(true)}
            style={{
              flexDirection: 'column',
              gap: 6,
              padding: '14px 8px',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: 12,
              border: '1px solid var(--color-border)',
            }}
          >
            <Share2 size={22} />
            <span style={{ color: 'var(--color-text)' }}>Eksportuj</span>
          </button>
          <button
            className="card btn"
            onClick={() => setShowImportModal(true)}
            style={{
              flexDirection: 'column',
              gap: 6,
              padding: '14px 8px',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: 12,
              border: '1px solid var(--color-border)',
            }}
          >
            <Download size={22} />
            <span style={{ color: 'var(--color-text)' }}>Importuj</span>
          </button>
        </div>

        {/* Tips */}
        <div className="card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>💡 Wskazówka dnia</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Kup Suica w Apple Wallet przed wyjazdem lub na lotnisku. To klucz do metra, autobusów i konbini w całej Japonii!
          </div>
        </div>

        {/* iOS install hint */}
        <div className="card" style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            📱 Aby dodać do ekranu głównego iPhone:<br/>
            Dotknij <strong>Udostępnij</strong> (□↑) → <strong>Dodaj do ekranu głównego</strong>
          </div>
        </div>

      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Eksportuj dane</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Eksportuje cały plan podróży, listę życzeń i budżet. Udostępnij współpodróżnym lub zapisz jako kopię zapasową.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleExport} style={{ width: '100%' }}>
                <Share2 size={16} />
                {copied ? '✓ Skopiowano!' : 'Kopiuj do schowka'}
              </button>
              <button className="btn btn-secondary" onClick={handleDownload} style={{ width: '100%' }}>
                <Download size={16} />
                Pobierz plik .json
              </button>
              <button className="btn btn-ghost" onClick={() => setShowShareModal(false)} style={{ width: '100%' }}>
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Importuj dane</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
              Wklej dane JSON otrzymane od współpodróżnego. Uwaga: zastąpi to istniejące dane!
            </div>
            <textarea
              className="input"
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(''); }}
              placeholder='Wklej JSON tutaj...'
              rows={6}
              style={{ resize: 'none', fontFamily: 'monospace', fontSize: 12 }}
            />
            {importError && (
              <div style={{ color: '#DC2626', fontSize: 13, marginTop: 6 }}>{importError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={() => setShowImportModal(false)} style={{ flex: 1 }}>
                Anuluj
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                style={{ flex: 1 }}
                disabled={!importText.trim()}
              >
                Importuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
