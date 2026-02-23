import type { ActivityCategory, ExpenseCategory, PhraseCategory } from '../types';

export const TRIP_START = new Date('2026-11-05');
export const TRIP_END = new Date('2026-11-18');
export const TRIP_DAYS = 14;

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { label: string; emoji: string; color: string }> = {
  zwiedzanie: { label: 'Zwiedzanie', emoji: '🏛️', color: '#D97706' },
  jedzenie:   { label: 'Jedzenie',   emoji: '🍜', color: '#DC2626' },
  transport:  { label: 'Transport',  emoji: '🚆', color: '#2563EB' },
  zakupy:     { label: 'Zakupy',     emoji: '🛍️', color: '#7C3AED' },
  nocleg:     { label: 'Nocleg',     emoji: '🏨', color: '#059669' },
  inne:       { label: 'Inne',       emoji: '📌', color: '#78716C' },
};

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  jedzenie:  { label: 'Jedzenie',    emoji: '🍜', color: '#DC2626' },
  transport: { label: 'Transport',   emoji: '🚆', color: '#2563EB' },
  nocleg:    { label: 'Nocleg',      emoji: '🏨', color: '#059669' },
  atrakcje:  { label: 'Atrakcje',    emoji: '🏛️', color: '#D97706' },
  zakupy:    { label: 'Zakupy',      emoji: '🛍️', color: '#7C3AED' },
  inne:      { label: 'Inne',        emoji: '📌', color: '#78716C' },
};

export const PHRASE_CATEGORIES: Record<PhraseCategory, { label: string; emoji: string }> = {
  powitania:       { label: 'Powitania',       emoji: '👋' },
  restauracja:     { label: 'Restauracja',     emoji: '🍣' },
  transport:       { label: 'Transport',       emoji: '🚆' },
  zakupy:          { label: 'Zakupy',          emoji: '🛍️' },
  naglePrzypadki:  { label: 'Nagłe przypadki', emoji: '🚨' },
  hotel:           { label: 'Hotel',           emoji: '🏨' },
  ogolne:          { label: 'Ogólne',          emoji: '💬' },
};

export const DEFAULT_EXCHANGE_RATE = 0.027; // 1 JPY = 0.027 PLN
export const DEFAULT_BUDGET_PLN = 10000;
