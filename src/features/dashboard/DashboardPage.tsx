import { useState, useEffect, useRef } from 'react';
import { differenceInDays, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, MessageCircle, Wallet, Map, Info, CheckCircle2, Users, Package, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { useTrip } from '../../context/TripContext';
import { useBudget } from '../../context/BudgetContext';
import { usePacking } from '../../context/PackingContext';
import { useSync } from '../../context/SyncContext';
import { useToast } from '../../context/ToastContext';
import { useWeather } from '../../hooks/useWeather';
import { TRIP_START, TRIP_END } from '../../lib/constants';
import { DAILY_TIPS } from '../../data/tips';
import { RoomModal } from '../../components/RoomModal';

// Zdjęcia Japonii — starannie dobrane, darmowe z Unsplash (bez klucza API)
const JAPAN_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
    caption: 'Kioto w sezonie momiji 🍁',
    credit: 'Kioto',
  },
  {
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    caption: 'Torii o świcie ⛩️',
    credit: 'Miyajima',
  },
  {
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    caption: 'Tokio nocą 🗼',
    credit: 'Tokio',
  },
  {
    url: 'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=800&q=80',
    caption: 'Góra Fuji 🗻',
    credit: 'Fuji',
  },
  {
    url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80',
    caption: 'Świątynia Senso-ji 🏯',
    credit: 'Asakusa',
  },
  {
    url: 'https://images.unsplash.com/photo-1578271887552-5ac3a72752bc?w=800&q=80',
    caption: 'Bambusowy gaj 🎋',
    credit: 'Arashiyama',
  },
] as const;

// Japońskie powitanie wg pory dnia
function getGreeting(): { jp: string; pl: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { jp: 'おはよう', pl: 'Dzień dobry' };
  if (h >= 11 && h < 17) return { jp: 'こんにちは', pl: 'Cześć' };
  if (h >= 17 && h < 22) return { jp: 'こんばんは', pl: 'Dobry wieczór' };
  return { jp: 'おやすみ', pl: 'Dobranoc' };
}


export function DashboardPage() {
  const navigate = useNavigate();
  const { days, wishlist } = useTrip();
  const { state } = useBudget();
  const { items: packingItems } = usePacking();
  const { roomCode, isConnected } = useSync();
  const { showToast } = useToast();
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showHint, setShowHint] = useState(() => !localStorage.getItem('japan2026_visited'));
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const milestoneRef = useRef(0);

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

  const safeDays = Array.isArray(days) ? days : [];
  const safeWishlist = Array.isArray(wishlist) ? wishlist : [];
  const safeExpenses = Array.isArray(state?.expenses) ? state.expenses : [];

  const totalActivities = safeDays.reduce((s, d) => s + d.activities.length, 0);
  const completedActivities = safeDays.reduce((s, d) => s + d.activities.filter((a) => a.completed).length, 0);
  const progressPct = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const totalSpentPLN = safeExpenses.reduce((s, e) => s + e.amountPLN, 0);
  const remainingPLN = (state?.budget ?? 0) - totalSpentPLN;
  const budgetPct = (state?.budget ?? 0) > 0
    ? Math.min(100, Math.round((totalSpentPLN / state.budget) * 100))
    : 0;

  const { weather, loading: weatherLoading } = useWeather(isDuringTrip);

  // Pakowanie
  const packedCount = packingItems.filter((i) => i.packed).length;
  const packingTotal = packingItems.length;
  const packingPct = packingTotal > 0 ? Math.round((packedCount / packingTotal) * 100) : 0;

  // Rotujące porady
  const tipIndex = Math.abs(daysUntil) % DAILY_TIPS.length;
  const tip = DAILY_TIPS[tipIndex];

  // Powitanie
  const greeting = getGreeting();

  // Celebracja kamieni milowych
  useEffect(() => {
    if (totalActivities === 0) return;
    const milestones = [25, 50, 75, 100];
    const lastCelebrated = parseInt(localStorage.getItem('japan2026_lastMilestone') ?? '0');
    const currentMilestone = milestones.filter((m) => progressPct >= m).pop() ?? 0;

    if (currentMilestone > lastCelebrated && currentMilestone > milestoneRef.current) {
      milestoneRef.current = currentMilestone;
      localStorage.setItem('japan2026_lastMilestone', String(currentMilestone));
      const msgs: Record<number, string> = {
        25: 'Świetny start! 25% planu gotowe 🌸',
        50: 'Połowa drogi! 50% zaplanowane 🗾',
        75: 'Prawie gotowe! 75% ukończone ⛩️',
        100: 'Sugoi! Plan wycieczki kompletny! 🎌✨',
      };
      if (msgs[currentMilestone]) {
        setTimeout(() => showToast(msgs[currentMilestone], 'success'), 500);
      }
    }
  }, [progressPct, totalActivities, showToast]);

  // Auto-scroll karuzeli co 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % JAPAN_PHOTOS.length);
      setPhotoLoaded(false);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Zamknij hint pierwszej wizyty
  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem('japan2026_visited', '1');
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Japonia 2026 🇯🇵" subtitle={`${greeting.jp} · ${greeting.pl}`} />
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Hint pierwszej wizyty */}
        {showHint && (
          <div className="card first-visit-hint" style={{ position: 'relative' }}>
            <button onClick={dismissHint} style={{
              position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4,
            }}>
              <X size={16} />
            </button>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>Witaj w asystencie podróży!</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              <span>📅 <strong>Plan</strong> — zaplanuj aktywności na każdy dzień</span>
              <span>💰 <strong>Budżet</strong> — śledź wydatki w JPY i PLN</span>
              <span>🧳 <strong>Bagaż</strong> — lista rzeczy do spakowania</span>
            </div>
          </div>
        )}

        {/* Karuzela zdjęć Japonii */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 200, background: '#1a1a2e', flexShrink: 0 }}>
          {/* Zdjęcie */}
          <img
            key={photoIndex}
            src={JAPAN_PHOTOS[photoIndex].url}
            alt={JAPAN_PHOTOS[photoIndex].caption}
            onLoad={() => setPhotoLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: photoLoaded ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          }} />
          {/* Caption */}
          <div style={{
            position: 'absolute', bottom: 10, left: 14, right: 14,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          }}>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              {JAPAN_PHOTOS[photoIndex].caption}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              {JAPAN_PHOTOS[photoIndex].credit}
            </span>
          </div>
          {/* Dots */}
          <div style={{
            position: 'absolute', top: 10, right: 12,
            display: 'flex', gap: 5, alignItems: 'center',
          }}>
            {JAPAN_PHOTOS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setPhotoIndex(i); setPhotoLoaded(false); }}
                style={{
                  width: i === photoIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === photoIndex ? 'white' : 'rgba(255,255,255,0.45)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.3s ease, background 0.3s ease',
                }}
              />
            ))}
          </div>
          {/* Unsplash attribution */}
          <div style={{
            position: 'absolute', bottom: 4, right: 8,
            fontSize: 9, color: 'rgba(255,255,255,0.4)',
          }}>
            © Unsplash
          </div>
        </div>

        {/* Countdown card z momiji */}
        <div className="card countdown-card" style={{
          border: 'none',
          color: 'white',
          textAlign: 'center',
          padding: '24px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Momiji leaves */}
          <div className="momiji-container">
            <div className="momiji-leaf" style={{ '--leaf-left': '15%', '--leaf-delay': '0s', '--leaf-duration': '9s' } as React.CSSProperties} />
            <div className="momiji-leaf" style={{ '--leaf-left': '55%', '--leaf-delay': '3s', '--leaf-duration': '11s' } as React.CSSProperties} />
            <div className="momiji-leaf" style={{ '--leaf-left': '80%', '--leaf-delay': '6s', '--leaf-duration': '10s' } as React.CSSProperties} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
              5–18 listopada 2026 · Tokio & Kioto
            </div>
            {isBeforeTrip && (
              <>
                <div className={daysUntil <= 90 ? 'countdown-pulse' : ''} style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{daysUntil}</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                  {daysUntil === 1 ? 'dzień do wyjazdu' : 'dni do wyjazdu'}
                </div>
                {daysUntil <= 30 && (
                  <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
                    もうすぐ · Już wkrótce!
                  </div>
                )}
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

        {/* Packing progress — widoczny gdy <7 dni do wyjazdu i pakowanie <100% */}
        {isBeforeTrip && daysUntil <= 7 && packingPct < 100 && packingTotal > 0 && (
          <div className="card" onClick={() => navigate('/bagaz')} style={{ cursor: 'pointer', borderLeft: '3px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={16} color="var(--color-primary)" />
                Spakuj się!
              </span>
              <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700 }}>
                {packingPct}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${packingPct}%` }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Wyjazd za {daysUntil} {daysUntil === 1 ? 'dzień' : 'dni'} — {packedCount}/{packingTotal} spakowane
            </div>
          </div>
        )}

        {/* Wishlist count */}
        {safeWishlist.length > 0 && (
          <div className="card" onClick={() => navigate('/plan')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                📌 Chcę odwiedzić
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>
                {safeWishlist.length}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {safeWishlist.length === 1 ? '1 miejsce' : `${safeWishlist.length} miejsc`} do zaplanowania
            </div>
          </div>
        )}

        {/* Weather info */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            {isDuringTrip ? '🌤️ Pogoda teraz' : '🍁 Pogoda w listopadzie'}
            {isDuringTrip && !weatherLoading && weather.some((w) => w.isLive) && (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                background: '#059669', color: 'white',
                padding: '2px 7px', borderRadius: 20,
              }}>LIVE</span>
            )}
          </div>
          {weatherLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{
                  background: 'var(--color-bg)', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid var(--color-border)', height: 76,
                }} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {weather.map((w) => (
                <div key={w.city} style={{
                  background: 'var(--color-bg)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{w.emoji} {w.city}</div>
                  {w.isLive && w.tempCurrent !== null ? (
                    <>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', margin: '2px 0', lineHeight: 1.1 }}>
                        {w.tempCurrent}°C
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {w.tempMin}–{w.tempMax}°C · {w.description}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', margin: '2px 0' }}>
                        {w.tempMin}–{w.tempMax}°C
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{w.description}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
            🍁 Szczyt sezonu momiji – idealna pora roku!
          </div>
        </div>

        {/* Budget summary */}
        {(state?.budget ?? 0) > 0 && (
          <div className="card" onClick={() => navigate('/budzet')} style={{ cursor: 'pointer' }}>
            <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wallet size={16} color="var(--color-primary)" />
              Budżet
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)' }}>
                {budgetPct}%
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
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
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{
                width: `${budgetPct}%`,
                background: totalSpentPLN > (state?.budget ?? 0) ? '#DC2626' : 'var(--color-primary)',
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              z {state?.budget ?? 0} zł całkowitego budżetu
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="noren-header" style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)' }}>
          SZYBKI DOSTĘP
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { icon: <Calendar size={22} />, label: 'Plan', to: '/plan' },
            { icon: <MessageCircle size={22} />, label: 'Rozmówki', to: '/rozmowki' },
            { icon: <Wallet size={22} />, label: 'Budżet', to: '/budzet' },
            { icon: <Map size={22} />, label: 'Mapa', to: '/mapa' },
            { icon: <Info size={22} />, label: 'Info', to: '/info' },
            { icon: <Package size={22} />, label: 'Bagaż', to: '/bagaz' },
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

        {/* Sync / Room */}
        <div className="noren-header" style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
          SYNCHRONIZACJA
        </div>
        <button
          className="card btn"
          onClick={() => setShowRoomModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            border: '1px solid var(--color-border)',
            textAlign: 'left',
          }}
        >
          <Users size={22} color="var(--color-primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>
              {roomCode ? 'Połączono z pokojem' : 'Synchronizuj ze współpodróżnymi'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {roomCode
                ? <>Kod: <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>{roomCode}</span> · {isConnected ? 'Online' : 'Offline'}</>
                : 'Utwórz lub dołącz do pokoju'}
            </div>
          </div>
          {roomCode && (
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isConnected ? '#059669' : '#9CA3AF',
              flexShrink: 0,
            }} />
          )}
        </button>

        {/* Rotating tip */}
        <div className="card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{tip.emoji} Wskazówka dnia</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {tip.text}
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

      {/* Room modal */}
      {showRoomModal && <RoomModal onClose={() => setShowRoomModal(false)} />}
    </div>
  );
}
