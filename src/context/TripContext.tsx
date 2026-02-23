import { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { TripDay, Activity, WishlistItem } from '../types';
import { generateDefaultTrip } from '../data/defaultTrip';
import { useIndexedDB } from '../hooks/useIndexedDB';

interface TripState {
  days: TripDay[];
  wishlist: WishlistItem[];
}

type TripAction =
  | { type: 'SET_DAYS'; days: TripDay[] }
  | { type: 'ADD_ACTIVITY'; dayId: string; activity: Omit<Activity, 'id' | 'order'> }
  | { type: 'UPDATE_ACTIVITY'; dayId: string; activity: Activity }
  | { type: 'DELETE_ACTIVITY'; dayId: string; activityId: string }
  | { type: 'TOGGLE_ACTIVITY'; dayId: string; activityId: string }
  | { type: 'UPDATE_NOTES'; dayId: string; notes: string }
  | { type: 'SET_WISHLIST'; wishlist: WishlistItem[] }
  | { type: 'ADD_WISHLIST_ITEM'; item: Omit<WishlistItem, 'id' | 'createdAt'> }
  | { type: 'DELETE_WISHLIST_ITEM'; id: string }
  | { type: 'MOVE_TO_DAY'; itemId: string; dayId: string }
  | { type: 'IMPORT_DATA'; days: TripDay[]; wishlist: WishlistItem[] };

function tripReducer(state: TripState, action: TripAction): TripState {
  switch (action.type) {
    case 'SET_DAYS':
      return { ...state, days: action.days };
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.wishlist };
    case 'ADD_ACTIVITY':
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? {
                ...d,
                activities: [
                  ...d.activities,
                  {
                    ...action.activity,
                    id: `${action.dayId}-${Date.now()}`,
                    order: d.activities.length,
                  },
                ],
              }
            : d
        ),
      };
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? { ...d, activities: d.activities.map((a) => (a.id === action.activity.id ? action.activity : a)) }
            : d
        ),
      };
    case 'DELETE_ACTIVITY':
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? { ...d, activities: d.activities.filter((a) => a.id !== action.activityId) }
            : d
        ),
      };
    case 'TOGGLE_ACTIVITY':
      return {
        ...state,
        days: state.days.map((d) =>
          d.id === action.dayId
            ? {
                ...d,
                activities: d.activities.map((a) =>
                  a.id === action.activityId ? { ...a, completed: !a.completed } : a
                ),
              }
            : d
        ),
      };
    case 'UPDATE_NOTES':
      return {
        ...state,
        days: state.days.map((d) => (d.id === action.dayId ? { ...d, notes: action.notes } : d)),
      };
    case 'ADD_WISHLIST_ITEM':
      return {
        ...state,
        wishlist: [
          ...state.wishlist,
          {
            ...action.item,
            id: `wish-${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case 'DELETE_WISHLIST_ITEM':
      return {
        ...state,
        wishlist: state.wishlist.filter((w) => w.id !== action.id),
      };
    case 'MOVE_TO_DAY': {
      const item = state.wishlist.find((w) => w.id === action.itemId);
      if (!item) return state;
      const newActivity: Activity = {
        id: `${action.dayId}-${Date.now()}`,
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        coordinates: item.coordinates,
        completed: false,
        order: 0,
      };
      return {
        ...state,
        wishlist: state.wishlist.filter((w) => w.id !== action.itemId),
        days: state.days.map((d) =>
          d.id === action.dayId
            ? { ...d, activities: [...d.activities, { ...newActivity, order: d.activities.length }] }
            : d
        ),
      };
    }
    case 'IMPORT_DATA':
      return { days: action.days, wishlist: action.wishlist };
    default:
      return state;
  }
}

interface TripContextValue {
  days: TripDay[];
  wishlist: WishlistItem[];
  dispatch: React.Dispatch<TripAction>;
  loading: boolean;
}

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const defaultDays = generateDefaultTrip();
  const [savedDays, setSavedDays, loadingDays] = useIndexedDB<TripDay[]>('tripDays', defaultDays);
  const [savedWishlist, setSavedWishlist, loadingWishlist] = useIndexedDB<WishlistItem[]>('wishlist', []);

  const loading = loadingDays || loadingWishlist;

  const [state, dispatch] = useReducer(tripReducer, { days: savedDays, wishlist: savedWishlist });

  useEffect(() => {
    if (!loadingDays) {
      dispatch({ type: 'SET_DAYS', days: savedDays });
    }
  }, [loadingDays]);

  useEffect(() => {
    if (!loadingWishlist) {
      dispatch({ type: 'SET_WISHLIST', wishlist: savedWishlist });
    }
  }, [loadingWishlist]);

  useEffect(() => {
    if (!loadingDays) {
      setSavedDays(state.days);
    }
  }, [state.days, loadingDays]);

  useEffect(() => {
    if (!loadingWishlist) {
      setSavedWishlist(state.wishlist);
    }
  }, [state.wishlist, loadingWishlist]);

  return (
    <TripContext.Provider value={{ days: state.days, wishlist: state.wishlist, dispatch, loading }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripProvider');
  return ctx;
}
