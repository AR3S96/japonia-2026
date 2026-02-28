import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB_zw5lktvRR8p98-y8nxwQJd6SUcDO0ck",
  authDomain: "japonia-2026-e80a9.firebaseapp.com",
  databaseURL: "https://japonia-2026-e80a9-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "japonia-2026-e80a9",
  storageBucket: "japonia-2026-e80a9.firebasestorage.app",
  messagingSenderId: "755425326286",
  appId: "1:755425326286:web:8d0cd6d6ec51400e49cc9f"
};

export function isConfigured(): boolean {
  return true;
}

let db: ReturnType<typeof getDatabase> | null = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

export { db };
