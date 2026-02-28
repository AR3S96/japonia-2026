const ROOM_CODE_KEY = 'syncRoomCode';
const CODE_LENGTH = 6;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  const arr = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(arr, (b) => CHARS[b % CHARS.length]).join('');
}

export function getSavedRoomCode(): string | null {
  return localStorage.getItem(ROOM_CODE_KEY);
}

export function saveRoomCode(code: string): void {
  localStorage.setItem(ROOM_CODE_KEY, code.toUpperCase());
}

export function clearRoomCode(): void {
  localStorage.removeItem(ROOM_CODE_KEY);
}
