import { useSync } from '../context/SyncContext';
import { WifiOff, Cloud } from 'lucide-react';

export function SyncIndicator() {
  const { roomCode, isConnected, isFirebaseConfigured } = useSync();

  if (!roomCode || !isFirebaseConfigured) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color: isConnected ? '#059669' : 'var(--color-text-muted)',
        padding: '3px 8px',
        borderRadius: 20,
        background: isConnected
          ? 'rgba(5, 150, 105, 0.1)'
          : 'rgba(128, 128, 128, 0.1)',
      }}
    >
      {isConnected ? <Cloud size={12} /> : <WifiOff size={12} />}
      <span style={{ fontWeight: 600, letterSpacing: 1, fontFamily: 'monospace' }}>
        {roomCode}
      </span>
    </div>
  );
}
