import { useState, useEffect, useCallback } from 'react';
import { loadFromDB, saveToDB } from '../lib/storage';

export function useIndexedDB<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromDB<T>(key, defaultValue).then((v) => {
      setValue(v);
      setLoading(false);
    });
  }, [key]);

  const save = useCallback((newValue: T) => {
    setValue(newValue);
    saveToDB(key, newValue);
  }, [key]);

  return [value, save, loading] as const;
}
