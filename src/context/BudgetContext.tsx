import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Expense, BudgetState } from '../types';
import { DEFAULT_BUDGET_PLN, DEFAULT_EXCHANGE_RATE } from '../lib/constants';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { fetchExchangeRate } from '../lib/exchangeRate';
import { generateId } from '../lib/utils';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useSync } from './SyncContext';
import { useToast } from './ToastContext';

type BudgetAction =
  | { type: 'SET_STATE'; state: BudgetState }
  | { type: 'ADD_EXPENSE'; expense: Omit<Expense, 'id' | 'createdAt'> }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'SET_BUDGET'; budget: number }
  | { type: 'SET_RATE'; rate: number }
  | { type: 'SET_RATE_AUTO'; rate: number; timestamp: string }
  | { type: 'IMPORT_BUDGET'; state: BudgetState };

const defaultState: BudgetState = {
  expenses: [],
  budget: DEFAULT_BUDGET_PLN,
  exchangeRate: DEFAULT_EXCHANGE_RATE,
};

function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'SET_STATE':
      return action.state;
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [
          ...state.expenses,
          { ...action.expense, id: generateId('exp'), createdAt: new Date().toISOString() },
        ],
      };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };
    case 'SET_BUDGET':
      return { ...state, budget: action.budget };
    case 'SET_RATE':
      return { ...state, exchangeRate: action.rate, lastRateUpdate: 'manual' };
    case 'SET_RATE_AUTO':
      return { ...state, exchangeRate: action.rate, lastRateUpdate: action.timestamp };
    case 'IMPORT_BUDGET':
      return { ...action.state };
    default:
      return state;
  }
}

interface BudgetContextValue {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
  loading: boolean;
  refreshRate: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved, loading] = useIndexedDB<BudgetState>('budgetState', defaultState);
  const [state, dispatch] = useReducer(budgetReducer, saved);

  useEffect(() => {
    if (!loading) dispatch({ type: 'SET_STATE', state: saved });
  }, [loading]);

  useEffect(() => {
    if (!loading) setSaved(state);
  }, [state, loading]);

  // Auto-fetch exchange rate on mount
  useEffect(() => {
    if (loading) return;
    // Don't override manual rate if set recently
    if (state.lastRateUpdate === 'manual') return;

    fetchExchangeRate().then(({ rate, fromCache }) => {
      if (!fromCache || !state.lastRateUpdate) {
        dispatch({ type: 'SET_RATE_AUTO', rate, timestamp: new Date().toISOString() });
      }
    });
  }, [loading]);

  const refreshRate = async () => {
    const { rate } = await fetchExchangeRate();
    dispatch({ type: 'SET_RATE_AUTO', rate, timestamp: new Date().toISOString() });
  };

  // Firebase sync
  const { roomCode } = useSync();
  const { showToast } = useToast();
  const syncEnabled = !!roomCode && !loading;
  const lastSyncErrorRef = useRef(0);

  const handleRemoteUpdate = useCallback((data: BudgetState) => {
    if (data && Array.isArray(data.expenses) && typeof data.budget === 'number') {
      dispatch({ type: 'IMPORT_BUDGET', state: data });
    }
  }, []);

  const handleSyncError = useCallback(() => {
    const now = Date.now();
    if (now - lastSyncErrorRef.current > 5000) {
      lastSyncErrorRef.current = now;
      showToast('Nie udało się zsynchronizować budżetu', 'error');
    }
  }, [showToast]);

  useFirebaseSync({
    roomCode,
    path: 'budget',
    localData: state,
    onRemoteUpdate: handleRemoteUpdate,
    enabled: syncEnabled,
    onError: handleSyncError,
  });

  return (
    <BudgetContext.Provider value={{ state, dispatch, loading, refreshRate }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
