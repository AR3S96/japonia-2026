import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { PackingItem, PackingCategory } from '../types';
import { generateDefaultPacking } from '../data/defaultPacking';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { generateId } from '../lib/utils';

type PackingAction =
  | { type: 'SET_ITEMS'; items: PackingItem[] }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'ADD_ITEM'; name: string; category: PackingCategory }
  | { type: 'DELETE_ITEM'; id: string }
  | { type: 'RESET_ALL' };

function packingReducer(state: PackingItem[], action: PackingAction): PackingItem[] {
  switch (action.type) {
    case 'SET_ITEMS':
      return action.items;
    case 'TOGGLE_ITEM':
      return state.map((i) => (i.id === action.id ? { ...i, packed: !i.packed } : i));
    case 'ADD_ITEM':
      return [
        ...state,
        {
          id: generateId('pack'),
          name: action.name,
          category: action.category,
          packed: false,
          createdAt: new Date().toISOString(),
        },
      ];
    case 'DELETE_ITEM':
      return state.filter((i) => i.id !== action.id);
    case 'RESET_ALL':
      return state.map((i) => ({ ...i, packed: false }));
    default:
      return state;
  }
}

interface PackingContextValue {
  items: PackingItem[];
  dispatch: React.Dispatch<PackingAction>;
  loading: boolean;
}

const PackingContext = createContext<PackingContextValue | null>(null);

const defaultItems = generateDefaultPacking();

export function PackingProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved, loading] = useIndexedDB<PackingItem[]>('packingItems', defaultItems);
  const [items, dispatch] = useReducer(packingReducer, saved);

  useEffect(() => {
    if (!loading) dispatch({ type: 'SET_ITEMS', items: saved });
  }, [loading]);

  useEffect(() => {
    if (!loading) setSaved(items);
  }, [items, loading]);

  return (
    <PackingContext.Provider value={{ items, dispatch, loading }}>
      {children}
    </PackingContext.Provider>
  );
}

export function usePacking() {
  const ctx = useContext(PackingContext);
  if (!ctx) throw new Error('usePacking must be used within PackingProvider');
  return ctx;
}
