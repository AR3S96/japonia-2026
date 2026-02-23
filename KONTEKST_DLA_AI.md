# Kontekst projektu dla Claude

Stworzyłeś mi aplikację PWA na wycieczkę do Japonii (5-18.11.2026, Tokio + Kioto).

## Linki
- **Appka online:** https://AR3S96.github.io/japonia-2026/
- **Kod na GitHub:** https://github.com/AR3S96/japonia-2026
- **Folder lokalny:** `C:\Users\damia\Nowy projekt`

## Stack techniczny
- React 19 + Vite + TypeScript
- Tailwind CSS v4 (@tailwindcss/vite)
- React Router v7 (HashRouter – ważne dla GitHub Pages!)
- Leaflet + react-leaflet (mapa OpenStreetMap)
- Recharts (wykresy budżetu)
- idb-keyval (dane offline w IndexedDB)
- vite-plugin-pwa (service worker, instalacja na iPhone)
- lucide-react (ikony)
- date-fns (daty, locale pl)

## Struktura projektu
```
src/
├── App.tsx                          # Główny layout, routing
├── index.css                        # Style globalne + CSS variables (motywy)
├── types/index.ts                   # Typy TypeScript
├── lib/constants.ts                 # Stałe (daty, kategorie, kursy)
├── lib/storage.ts                   # Wrapper na idb-keyval
├── data/
│   ├── defaultTrip.ts               # 73 aktywności na 14 dni (Tokio + Kioto)
│   ├── phrases.ts                   # ~81 fraz japońskich w 7 kategoriach
│   └── japanInfo.ts                 # Etykieta, numery alarmowe, transport, listopad
├── hooks/
│   ├── useIndexedDB.ts              # Persystencja danych offline
│   └── useSpeechSynthesis.ts        # Wymowa japońska (Web Speech API)
├── context/
│   ├── TripContext.tsx              # Stan plannera (aktywności 14 dni)
│   ├── BudgetContext.tsx            # Stan budżetu (wydatki, kurs JPY/PLN)
│   └── SettingsContext.tsx          # Motyw light/dark
├── components/
│   ├── Header.tsx                   # Nagłówek + przełącznik dark mode
│   └── BottomNav.tsx                # Dolna nawigacja (5 tabów)
└── features/
    ├── dashboard/DashboardPage.tsx  # Główna: odliczanie, pogoda, postęp, budżet
    ├── planner/PlannerPage.tsx      # Plan 14 dni: aktywności, formularze
    ├── phrasebook/PhrasebookPage.tsx # Rozmówki: kategorie, frazy, wymowa
    ├── budget/BudgetPage.tsx        # Budżet: wydatki, przelicznik, wykresy
    ├── info/InfoPage.tsx            # Info: etykieta, numery, aplikacje, transport
    └── map/
        ├── MapPage.tsx              # Strona mapy z przełącznikiem Tokio/Kioto
        └── MapView.tsx              # Leaflet (lazy-loaded)
```

## Kluczowe decyzje techniczne
- **HashRouter** (nie BrowserRouter) – konieczne dla GitHub Pages
- **base: './'** w vite.config.ts – konieczne dla GitHub Pages
- Dane w **IndexedDB** (offline-first), fallback na localStorage
- Mapa **lazy-loaded** (React.lazy) – Leaflet jest duży (~150KB)
- **Web Speech API** do wymowy japońskiej – bez plików audio
- Motyw przełączany przez `data-theme="dark"` na `<html>`
- CSS custom properties (`--color-primary` itp.) dla całego motywu

## Deploy
```
npm run deploy
```
Buduje i wgrywa na branch `gh-pages` → automatycznie publikuje na GitHub Pages.

## Zmiany zrobione (sesja 2 – luty 2026)

### 1. Liquid Glass CSS (`src/index.css`)
- Efekt "liquid glass" w stylu Apple iOS 26 na kartach, headerze, navie i modalach
- `backdrop-filter: blur(24px) saturate(1.7) brightness(1.05)` + inner glow via `box-shadow`
- Pseudo-element `::before` na `.card` – gradient od góry symulujący refrakcję światła
- Animacja `ambientDrift` – wolny ruch gradientu tła (20s cykl)
- Mocniejszy blur na `.modal-sheet` z inner glow
- Pełne warianty dark mode
- **FIX:** `overflow: hidden` → `overflow: clip` na `.card` – karty nie ucinały zawartości na mobile!

### 2. Auto-kursy walut (`src/lib/exchangeRate.ts` + `src/context/BudgetContext.tsx`)
- Nowy plik `exchangeRate.ts`: pobiera kurs JPY/PLN z Frankfurter API
- Cache w localStorage (TTL 6h) – nie bije po API przy każdym otwarciu
- Fallback chain: Frankfurter → fawazahmed0 CDN → stary cache → domyślny 0.027
- BudgetContext: auto-fetch kursu przy starcie, akcja `SET_RATE_WITH_TIMESTAMP`
- BudgetPage: pokazuje timestamp ostatniej aktualizacji + przycisk odśwież (↻)

### 3. Lista życzeń "Chcę odwiedzić" (`src/components/WishlistSection.tsx` + `src/context/TripContext.tsx`)
- Nowy typ `WishlistItem` w `src/types/index.ts`
- TripContext rozszerzony o `wishlist: WishlistItem[]` (IndexedDB, osobny klucz)
- Akcje: `ADD_WISHLIST_ITEM`, `DELETE_WISHLIST_ITEM`, `MOVE_TO_DAY`
- Komponent WishlistSection: zwijana sekcja, karty z kategorią/lokalizacją, day-picker do przenoszenia
- Integracja w PlannerPage (nad listą aktywności) i DashboardPage (licznik)

### 4. Eksport/Import danych (`src/lib/tripExport.ts`)
- `exportAllData()` – serializuje cały plan + wishlist + budżet do JSON
- `parseImport()` – waliduje i parsuje JSON od współpodróżnego
- UI w DashboardPage: modal "Eksportuj dane" (kopiuj do schowka / pobierz .json) + modal "Importuj"
- Akcje: `IMPORT_DATA` (TripContext), `IMPORT_BUDGET` (BudgetContext)

### Nowe pliki
- `src/lib/exchangeRate.ts`
- `src/lib/tripExport.ts`
- `src/components/WishlistSection.tsx`

## Co chcę zmienić
[OPISZ TUTAJ CO CHCESZ ZMIENIĆ]
