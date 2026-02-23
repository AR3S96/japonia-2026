import type { TripDay, WishlistItem, BudgetState } from '../types';

interface ExportData {
  version: 1;
  exportedAt: string;
  days: TripDay[];
  wishlist: WishlistItem[];
  budget: BudgetState;
}

export function exportAllData(
  days: TripDay[],
  wishlist: WishlistItem[],
  budget: BudgetState
): string {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    days,
    wishlist,
    budget,
  };
  return JSON.stringify(data, null, 2);
}

export function parseImport(json: string): ExportData | null {
  try {
    const data = JSON.parse(json);
    if (!data || data.version !== 1) return null;
    if (!Array.isArray(data.days) || !Array.isArray(data.wishlist) || !data.budget) return null;
    // Basic validation
    if (!data.days.every((d: any) => d.id && d.date && Array.isArray(d.activities))) return null;
    if (!data.budget.expenses || typeof data.budget.budget !== 'number') return null;
    return data as ExportData;
  } catch {
    return null;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }
}

export function downloadJson(text: string, filename = 'japonia-2026-dane.json') {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
