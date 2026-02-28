import { useState, useEffect } from 'react';

export interface CityWeather {
  city: string;
  emoji: string;
  tempMin: number;
  tempMax: number;
  tempCurrent: number | null; // null = brak danych live
  description: string;
  weatherCode: number | null;
  isLive: boolean;
}

// Kody pogodowe WMO → opis + emoji
function decodeWeather(code: number): { desc: string; emoji: string } {
  if (code === 0)                 return { desc: 'Bezchmurnie',   emoji: '☀️' };
  if (code <= 2)                  return { desc: 'Lekkie chmury', emoji: '🌤️' };
  if (code <= 3)                  return { desc: 'Zachmurzenie',  emoji: '☁️' };
  if (code <= 49)                 return { desc: 'Mgła',          emoji: '🌫️' };
  if (code <= 59)                 return { desc: 'Mżawka',        emoji: '🌦️' };
  if (code <= 69)                 return { desc: 'Deszcz',        emoji: '🌧️' };
  if (code <= 79)                 return { desc: 'Śnieg',         emoji: '🌨️' };
  if (code <= 84)                 return { desc: 'Przelotny deszcz', emoji: '🌦️' };
  if (code <= 99)                 return { desc: 'Burza',         emoji: '⛈️' };
  return { desc: 'Zmienna pogoda', emoji: '🌈' };
}

const CITIES = [
  { name: 'Tokio',  emoji: '🗼', lat: 35.6762, lon: 139.6503 },
  { name: 'Kioto',  emoji: '⛩️', lat: 35.0116, lon: 135.7681 },
];

const CACHE_KEY = 'japan2026_weather';
const CACHE_TTL = 60 * 60 * 1000; // 1h

function loadCache(): { data: CityWeather[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchLiveWeather(lat: number, lon: number): Promise<{ tempCurrent: number; code: number }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  const json = await res.json();
  return {
    tempCurrent: Math.round(json.current.temperature_2m),
    code: json.current.weather_code,
  };
}

async function fetchClimatology(lat: number, lon: number): Promise<{ tempMin: number; tempMax: number }> {
  // Pobiera normy klimatyczne dla listopada — średnia za ostatnie lata
  // Open-Meteo historical — używamy prev year November jako przybliżenie
  const url = `https://api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&start_date=2024-11-05&end_date=2024-11-18&models=EC_Earth3P_HR`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('climate fetch failed');
    const json = await res.json();
    const maxes: number[] = json.daily.temperature_2m_max;
    const mins: number[] = json.daily.temperature_2m_min;
    const avgMax = Math.round(maxes.reduce((a, b) => a + b, 0) / maxes.length);
    const avgMin = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
    return { tempMax: avgMax, tempMin: avgMin };
  } catch {
    // Fallback: znane wartości historyczne dla Japonii w listopadzie
    const fallback: Record<string, { tempMin: number; tempMax: number }> = {
      tokio: { tempMin: 9, tempMax: 17 },
      kioto: { tempMin: 7, tempMax: 15 },
    };
    const key = lat > 35.5 ? 'tokio' : 'kioto';
    return fallback[key];
  }
}

export function useWeather(isDuringTrip: boolean) {
  const [weather, setWeather] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Sprawdź cache
      const cached = loadCache();
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        if (!cancelled) {
          setWeather(cached.data);
          setLoading(false);
        }
        return;
      }

      try {
        const results: CityWeather[] = await Promise.all(
          CITIES.map(async (city) => {
            if (isDuringTrip) {
              // Podczas podróży — live pogoda
              try {
                const live = await fetchLiveWeather(city.lat, city.lon);
                const weather = decodeWeather(live.code);
                // Też pobierz klimatologię dla min/max dnia
                const clim = await fetchClimatology(city.lat, city.lon);
                return {
                  city: city.name,
                  emoji: city.emoji,
                  tempMin: clim.tempMin,
                  tempMax: clim.tempMax,
                  tempCurrent: live.tempCurrent,
                  description: weather.desc,
                  weatherCode: live.code,
                  isLive: true,
                };
              } catch {
                // Fallback do klimatologii
                const clim = await fetchClimatology(city.lat, city.lon);
                return {
                  city: city.name,
                  emoji: city.emoji,
                  ...clim,
                  tempCurrent: null,
                  description: 'Listopad w Japonii',
                  weatherCode: null,
                  isLive: false,
                };
              }
            } else {
              // Przed podróżą — klimatologia
              const clim = await fetchClimatology(city.lat, city.lon);
              return {
                city: city.name,
                emoji: city.emoji,
                ...clim,
                tempCurrent: null,
                description: city.name === 'Tokio' ? 'Słonecznie, sucho' : 'Chłodniej wieczorem',
                weatherCode: null,
                isLive: false,
              };
            }
          })
        );

        if (!cancelled) {
          setWeather(results);
          setLoading(false);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: results, ts: Date.now() }));
        }
      } catch {
        if (!cancelled) {
          // Statyczny fallback
          setWeather(CITIES.map((city, i) => ({
            city: city.name,
            emoji: city.emoji,
            tempMin: i === 0 ? 8 : 6,
            tempMax: i === 0 ? 17 : 15,
            tempCurrent: null,
            description: i === 0 ? 'Słonecznie, sucho' : 'Chłodniej wieczorem',
            weatherCode: null,
            isLive: false,
          })));
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isDuringTrip]);

  return { weather, loading };
}
