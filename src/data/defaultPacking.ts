import type { PackingItem, PackingCategory } from '../types';
import { generateId } from '../lib/utils';

const RAW: { name: string; category: PackingCategory }[] = [
  // dokumenty
  { name: 'Paszport (ważny min. 6 mies.)', category: 'dokumenty' },
  { name: 'JR Pass (wydrukowany voucher)', category: 'dokumenty' },
  { name: 'Ubezpieczenie podróżne (PDF)', category: 'dokumenty' },
  { name: 'Rezerwacje hoteli (PDF)', category: 'dokumenty' },
  { name: 'Gotówka JPY', category: 'dokumenty' },
  { name: 'Karta wielowalutowa (Revolut/Wise)', category: 'dokumenty' },
  // elektronika
  { name: 'Adapter wtyczek typ A (Japonia)', category: 'elektronika' },
  { name: 'Karta SIM / eSIM na Japonię', category: 'elektronika' },
  { name: 'Power bank (max 100 Wh na pokład)', category: 'elektronika' },
  { name: 'Ładowarka do telefonu', category: 'elektronika' },
  { name: 'Słuchawki', category: 'elektronika' },
  // kosmetyki
  { name: 'Ibuprofen / leki podstawowe', category: 'kosmetyki' },
  { name: 'Krem z filtrem UV', category: 'kosmetyki' },
  { name: 'Plastry / mała apteczka', category: 'kosmetyki' },
  // ubrania
  { name: 'Lekka kurtka przeciwdeszczowa', category: 'ubrania' },
  { name: 'Wygodne buty do chodzenia', category: 'ubrania' },
  { name: 'Ciepły sweter (listopad: 6–17°C)', category: 'ubrania' },
  { name: 'Skarpetki bez dziur (onsen!)', category: 'ubrania' },
  // inne
  { name: 'Składana torba na zakupy', category: 'inne' },
  { name: 'Małe zestawy chusteczek', category: 'inne' },
];

export function generateDefaultPacking(): PackingItem[] {
  const now = new Date().toISOString();
  return RAW.map((item) => ({
    ...item,
    id: generateId('pack'),
    packed: false,
    createdAt: now,
  }));
}
