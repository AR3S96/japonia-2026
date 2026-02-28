import { useState } from 'react';
import { useSync } from '../context/SyncContext';
import { Users, Copy, LogIn, LogOut, Plus, Loader2 } from 'lucide-react';

interface RoomModalProps {
  onClose: () => void;
}

export function RoomModal({ onClose }: RoomModalProps) {
  const { roomCode, isConnected, createRoom, joinRoom, leaveRoom, isFirebaseConfigured } = useSync();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isFirebaseConfigured) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="modal-handle" />
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Synchronizacja</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Firebase nie jest jeszcze skonfigurowane. Skontaktuj się z administratorem aplikacji, aby włączyć synchronizację.
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%' }}>
            Zamknij
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      await createRoom();
    } catch {
      setError('Nie udało się utworzyć pokoju. Sprawdź połączenie z internetem.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.length < 6) {
      setError('Kod pokoju musi mieć 6 znaków.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await joinRoom(joinCode);
      if (!ok) {
        setError('Nie znaleziono pokoju o tym kodzie. Sprawdź czy kod jest poprawny.');
      }
    } catch {
      setError('Błąd połączenia. Sprawdź internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    leaveRoom();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={20} />
          Synchronizacja
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          {roomCode
            ? 'Jesteś połączony z pokojem. Wszyscy z tym samym kodem widzą te same dane.'
            : 'Utwórz pokój lub dołącz do istniejącego, aby synchronizować dane ze współpodróżnymi.'}
        </div>

        {roomCode ? (
          <>
            {/* Aktywny pokój */}
            <div style={{
              textAlign: 'center',
              padding: '20px 16px',
              background: 'var(--color-bg)',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Kod pokoju</div>
              <div style={{
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: 4,
                fontFamily: 'monospace',
                color: 'var(--color-primary)',
              }}>
                {roomCode}
              </div>
              <div style={{
                marginTop: 8,
                fontSize: 12,
                color: isConnected ? '#059669' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isConnected ? '#059669' : '#9CA3AF',
                }} />
                {isConnected ? 'Połączono' : 'Offline'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleCopy} style={{ width: '100%' }}>
                <Copy size={16} />
                {copied ? 'Skopiowano!' : 'Kopiuj kod'}
              </button>
              <button className="btn btn-secondary" onClick={handleLeave} style={{ width: '100%', color: '#DC2626' }}>
                <LogOut size={16} />
                Rozłącz
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Dołącz lub utwórz */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                Utwórz nowy pokój
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--color-text-muted)',
                fontSize: 13,
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                lub dołącz
                <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                    setError('');
                  }}
                  placeholder="Wpisz kod..."
                  maxLength={6}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    letterSpacing: 4,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: 18,
                    textTransform: 'uppercase',
                  }}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleJoin}
                  disabled={loading || joinCode.length < 6}
                  style={{ paddingInline: 16 }}
                >
                  {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ color: '#DC2626', fontSize: 13, marginTop: 10, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', marginTop: 12 }}>
          Zamknij
        </button>
      </div>
    </div>
  );
}
