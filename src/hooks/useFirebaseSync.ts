import { useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, off } from 'firebase/database';
import type { DataSnapshot } from 'firebase/database';
import { db } from '../lib/firebase';

interface SyncOptions<T> {
  roomCode: string | null;
  path: string;
  localData: T;
  onRemoteUpdate: (data: T) => void;
  enabled: boolean;
  onError?: (err: unknown) => void;
}

// Firebase nie akceptuje undefined — zamień na null rekurencyjnie
function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, v === undefined ? null : stripUndefined(v)])
    );
  }
  return obj;
}

export function useFirebaseSync<T>({ roomCode, path, localData, onRemoteUpdate, enabled, onError }: SyncOptions<T>) {
  const lastPushedRef = useRef<string>('');
  const lastReceivedRef = useRef<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);
  onRemoteUpdateRef.current = onRemoteUpdate;

  // Subskrypcja na zmiany zdalne
  useEffect(() => {
    if (!enabled || !roomCode || !db) return;

    const dbRef = ref(db, `rooms/${roomCode}/${path}`);

    const handleValue = (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const { _lastModified: _, ...rest } = data as T & { _lastModified?: string };
        const serialized = JSON.stringify(rest);

        // Ignoruj echo naszego własnego push
        if (serialized === lastPushedRef.current) return;

        // Zapamiętaj co dostaliśmy — push effect to sprawdzi
        lastReceivedRef.current = serialized;
        onRemoteUpdateRef.current(rest as T);
      }
    };

    onValue(dbRef, handleValue);

    return () => {
      off(dbRef, 'value', handleValue);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [roomCode, path, enabled]);

  // Push lokalnych zmian do Firebase (z debounce 500ms)
  useEffect(() => {
    if (!enabled || !roomCode || !db) return;

    const serialized = JSON.stringify(localData);

    // Nie pushuj jeśli dane identyczne z ostatnim pushem lub ostatnim odbiorem
    if (serialized === lastPushedRef.current) return;
    if (serialized === lastReceivedRef.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      // Ponowna weryfikacja po debounce
      if (serialized === lastPushedRef.current) return;
      if (serialized === lastReceivedRef.current) return;

      lastPushedRef.current = serialized;
      if (!db) return;
      const dbRef = ref(db, `rooms/${roomCode}/${path}`);
      const clean = stripUndefined({ ...(localData as object), _lastModified: new Date().toISOString() });
      set(dbRef, clean).catch((err) => onError?.(err));
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [localData, roomCode, path, enabled]);

  const pushNow = useCallback(() => {
    if (!roomCode || !db) return;
    const serialized = JSON.stringify(localData);
    lastPushedRef.current = serialized;
    const dbRef = ref(db, `rooms/${roomCode}/${path}`);
    const clean = stripUndefined({ ...(localData as object), _lastModified: new Date().toISOString() });
    set(dbRef, clean).catch((err) => onError?.(err));
  }, [localData, roomCode, path, onError]);

  return { pushNow };
}
