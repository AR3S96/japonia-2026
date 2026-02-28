import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ref, get, set, onValue, off } from 'firebase/database';
import { db, isConfigured } from '../lib/firebase';
import { generateRoomCode, getSavedRoomCode, saveRoomCode, clearRoomCode } from '../lib/roomCode';

interface SyncContextValue {
  roomCode: string | null;
  isConnected: boolean;
  isFirebaseConfigured: boolean;
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [roomCode, setRoomCode] = useState<string | null>(getSavedRoomCode);
  const [isConnected, setIsConnected] = useState(false);
  const firebaseConfigured = isConfigured();

  // Monitoruj stan połączenia Firebase
  useEffect(() => {
    if (!firebaseConfigured || !db || !roomCode) {
      setIsConnected(false);
      return;
    }

    const connRef = ref(db, '.info/connected');
    onValue(connRef, (snap) => {
      setIsConnected(snap.val() === true);
    });

    return () => off(connRef);
  }, [firebaseConfigured, roomCode]);

  const createRoom = useCallback(async (): Promise<string> => {
    if (!db) throw new Error('Firebase nie jest skonfigurowane');

    const code = generateRoomCode();
    const roomRef = ref(db, `rooms/${code}`);
    await set(roomRef, {
      createdAt: new Date().toISOString(),
    });

    saveRoomCode(code);
    setRoomCode(code);
    return code;
  }, []);

  const joinRoom = useCallback(async (code: string): Promise<boolean> => {
    if (!db) return false;

    const upperCode = code.trim().toUpperCase();
    if (upperCode.length !== 6) return false;
    if (!/^[A-Z0-9]{6}$/.test(upperCode)) return false;

    const roomRef = ref(db, `rooms/${upperCode}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) return false;

    saveRoomCode(upperCode);
    setRoomCode(upperCode);
    return true;
  }, []);

  const leaveRoom = useCallback(() => {
    clearRoomCode();
    setRoomCode(null);
    setIsConnected(false);
  }, []);

  return (
    <SyncContext.Provider value={{
      roomCode,
      isConnected,
      isFirebaseConfigured: firebaseConfigured,
      createRoom,
      joinRoom,
      leaveRoom,
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
