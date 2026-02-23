const CACHE_KEY = 'jpyPlnRate';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

interface CachedRate {
  rate: number;
  timestamp: number;
}

function getCached(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRate;
    if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed;
    return null;
  } catch {
    return null;
  }
}

function setCache(rate: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
}

async function fetchFrankfurter(): Promise<number> {
  const res = await fetch('https://api.frankfurter.dev/v1/latest?base=JPY&symbols=PLN');
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
  const data = await res.json();
  return data.rates.PLN;
}

async function fetchFawazahmed(): Promise<number> {
  const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json');
  if (!res.ok) throw new Error(`fawazahmed0 ${res.status}`);
  const data = await res.json();
  return data.jpy.pln;
}

const DEFAULT_RATE = 0.027;

export async function fetchExchangeRate(): Promise<{ rate: number; fromCache: boolean }> {
  // Try cache first
  const cached = getCached();

  // Try Frankfurter
  try {
    const rate = await fetchFrankfurter();
    setCache(rate);
    return { rate, fromCache: false };
  } catch {
    // Frankfurter failed
  }

  // Try fawazahmed0
  try {
    const rate = await fetchFawazahmed();
    setCache(rate);
    return { rate, fromCache: false };
  } catch {
    // fawazahmed0 failed
  }

  // Use cache (even expired)
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedRate;
      return { rate: parsed.rate, fromCache: true };
    }
  } catch {
    // cache read failed
  }

  // Last resort
  return { rate: DEFAULT_RATE, fromCache: true };
}
