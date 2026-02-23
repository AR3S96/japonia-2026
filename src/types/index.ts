export type ActivityCategory = 'zwiedzanie' | 'jedzenie' | 'transport' | 'zakupy' | 'nocleg' | 'inne';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  time?: string;
  location?: string;
  coordinates?: [number, number];
  category: ActivityCategory;
  completed: boolean;
  order: number;
}

export interface TripDay {
  id: string;
  date: string;
  label: string;
  location: 'tokyo' | 'kyoto' | 'travel';
  activities: Activity[];
  notes: string;
}

export type ExpenseCategory = 'jedzenie' | 'transport' | 'nocleg' | 'atrakcje' | 'zakupy' | 'inne';

export interface Expense {
  id: string;
  date: string;
  amount: number;
  amountPLN: number;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
}

export interface BudgetState {
  expenses: Expense[];
  budget: number;
  exchangeRate: number;
  lastRateUpdate?: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  location?: string;
  coordinates?: [number, number];
  createdAt: string;
}

export type PhraseCategory = 'powitania' | 'restauracja' | 'transport' | 'zakupy' | 'naglePrzypadki' | 'hotel' | 'ogolne';

export interface Phrase {
  id: string;
  polish: string;
  japanese: string;
  romaji: string;
  category: PhraseCategory;
}
