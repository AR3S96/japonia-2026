import { useState } from 'react';
import { Plus, Trash2, Settings, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '../../components/Header';
import { useBudget } from '../../context/BudgetContext';
import type { ExpenseCategory } from '../../types';
import { EXPENSE_CATEGORIES } from '../../lib/constants';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export function BudgetPage() {
  const { state, dispatch, refreshRate } = useBudget();
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [converterJPY, setConverterJPY] = useState('');
  const [converterPLN, setConverterPLN] = useState('');
  const [activeTab, setActiveTab] = useState<'lista' | 'wykresy'>('lista');

  const totalSpentPLN = state.expenses.reduce((s, e) => s + e.amountPLN, 0);
  const remaining = state.budget - totalSpentPLN;
  const avgDaily = state.expenses.length > 0
    ? totalSpentPLN / new Set(state.expenses.map((e) => e.date)).size
    : 0;

  // Group by date
  const byDate: Record<string, typeof state.expenses> = {};
  state.expenses.forEach((e) => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  // Category totals for pie
  const catTotals = Object.entries(EXPENSE_CATEGORIES).map(([cat, info]) => ({
    name: info.label,
    value: state.expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amountPLN, 0),
    color: info.color,
    emoji: info.emoji,
  })).filter((c) => c.value > 0);

  // Daily bar chart
  const dailyData = sortedDates.slice(0, 10).reverse().map((date) => ({
    date: format(new Date(date), 'dd.MM'),
    PLN: Math.round(byDate[date].reduce((s, e) => s + e.amountPLN, 0)),
  }));

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Header title="Tracker budżetu" subtitle={`Budżet: ${state.budget} zł`} />
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Wydano', value: `${totalSpentPLN.toFixed(0)} zł`, color: '#DC2626' },
            { label: 'Pozostało', value: `${remaining.toFixed(0)} zł`, color: remaining >= 0 ? '#059669' : '#DC2626' },
            { label: 'Śr./dzień', value: `${avgDaily.toFixed(0)} zł`, color: 'var(--color-primary)' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Budget progress */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Wykorzystanie budżetu</span>
            <span style={{ fontWeight: 600 }}>{Math.min(100, Math.round((totalSpentPLN / state.budget) * 100))}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{
              width: `${Math.min(100, (totalSpentPLN / state.budget) * 100)}%`,
              background: totalSpentPLN > state.budget ? '#DC2626' : 'var(--color-primary)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            <span>{totalSpentPLN.toFixed(0)} zł</span>
            <span>{state.budget} zł</span>
          </div>
        </div>

        {/* Converter */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeftRight size={16} color="var(--color-primary)" />
            Przelicznik walut
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              1 JPY = {state.exchangeRate} PLN
              <button
                onClick={async () => {
                  setRefreshing(true);
                  await refreshRate();
                  setRefreshing(false);
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  color: 'var(--color-primary)', display: 'flex', alignItems: 'center',
                }}
                title="Odśwież kurs"
              >
                <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </span>
          </div>
          {state.lastRateUpdate && state.lastRateUpdate !== 'manual' && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Kurs automatyczny · Ost. aktualizacja: {new Date(state.lastRateUpdate).toLocaleString('pl-PL')}
            </div>
          )}
          {state.lastRateUpdate === 'manual' && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Kurs ustawiony ręcznie
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>JPY (¥)</div>
              <input
                className="input"
                type="number"
                value={converterJPY}
                onChange={(e) => {
                  setConverterJPY(e.target.value);
                  setConverterPLN(e.target.value ? (parseFloat(e.target.value) * state.exchangeRate).toFixed(2) : '');
                }}
                placeholder="0"
              />
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginTop: 16 }}>⇄</span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>PLN (zł)</div>
              <input
                className="input"
                type="number"
                value={converterPLN}
                onChange={(e) => {
                  setConverterPLN(e.target.value);
                  setConverterJPY(e.target.value ? (parseFloat(e.target.value) / state.exchangeRate).toFixed(0) : '');
                }}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['lista', 'wykresy'] as const).map((tab) => (
            <button
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab)}
              style={{ flex: 1 }}
            >
              {tab === 'lista' ? '📋 Lista' : '📊 Wykresy'}
            </button>
          ))}
        </div>

        {activeTab === 'lista' && (
          <>
            {sortedDates.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
                <div>Brak wydatków</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Dodaj pierwszy wydatek przyciskiem poniżej</div>
              </div>
            ) : (
              sortedDates.map((date) => (
                <div key={date}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: pl })} ·{' '}
                    {byDate[date].reduce((s, e) => s + e.amountPLN, 0).toFixed(0)} zł
                  </div>
                  {byDate[date].map((expense) => (
                    <div key={expense.id} className="activity-item" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{EXPENSE_CATEGORIES[expense.category].emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{expense.description}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {EXPENSE_CATEGORIES[expense.category].label}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{expense.amountPLN.toFixed(0)} zł</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{expense.amount.toLocaleString()} ¥</div>
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'DELETE_EXPENSE', id: expense.id })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'wykresy' && (
          <>
            {catTotals.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                Dodaj wydatki, aby zobaczyć wykresy
              </div>
            ) : (
              <>
                <div className="card">
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Wydatki według kategorii</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={catTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {catTotals.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${Number(v).toFixed(0)} zł`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {catTotals.map((c) => (
                      <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <span style={{ width: 10, height: 10, background: c.color, borderRadius: 2, flexShrink: 0 }} />
                        {c.emoji} {c.name}: {c.value.toFixed(0)} zł
                      </div>
                    ))}
                  </div>
                </div>
                {dailyData.length > 1 && (
                  <div className="card">
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>Dzienne wydatki (PLN)</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={dailyData}>
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={(v: any) => [`${v} zł`, 'Wydatki']} />
                        <Bar dataKey="PLN" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{ flex: 1 }}
          >
            <Plus size={18} />
            Dodaj wydatek
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(true)}
            style={{ minWidth: 44 }}
          >
            <Settings size={18} />
          </button>
        </div>

      </div>

      {showForm && (
        <ExpenseForm
          rate={state.exchangeRate}
          onSave={(expense) => { dispatch({ type: 'ADD_EXPENSE', expense }); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {showSettings && (
        <BudgetSettings
          budget={state.budget}
          rate={state.exchangeRate}
          onSave={(b, r) => {
            dispatch({ type: 'SET_BUDGET', budget: b });
            dispatch({ type: 'SET_RATE', rate: r });
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function ExpenseForm({ rate, onSave, onClose }: {
  rate: number;
  onSave: (e: { amount: number; amountPLN: number; category: ExpenseCategory; description: string; date: string }) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ amount: '', description: '', category: 'jedzenie' as ExpenseCategory, date: today, currency: 'JPY' as 'JPY' | 'PLN' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const amountNum = parseFloat(form.amount) || 0;
  const jpy = form.currency === 'JPY' ? amountNum : Math.round(amountNum / rate);
  const pln = form.currency === 'PLN' ? amountNum : parseFloat((amountNum * rate).toFixed(2));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Dodaj wydatek</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Kwota</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" style={{ flex: 1 }} />
              <select className="input" value={form.currency} onChange={(e) => set('currency', e.target.value)} style={{ width: 80 }}>
                <option value="JPY">¥ JPY</option>
                <option value="PLN">zł PLN</option>
              </select>
            </div>
            {amountNum > 0 && (
              <div style={{ fontSize: 13, color: 'var(--color-primary)', marginTop: 4 }}>
                ≈ {form.currency === 'JPY' ? `${pln.toFixed(2)} zł` : `${jpy.toLocaleString()} ¥`}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Opis *</label>
            <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="np. Ramen Ichiran" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Kategoria</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Data</label>
              <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Anuluj</button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={!form.description.trim() || amountNum <= 0}
              onClick={() => form.description.trim() && amountNum > 0 && onSave({
                amount: jpy,
                amountPLN: pln,
                category: form.category,
                description: form.description,
                date: form.date,
              })}
            >
              Dodaj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetSettings({ budget, rate, onSave, onClose }: {
  budget: number; rate: number;
  onSave: (b: number, r: number) => void;
  onClose: () => void;
}) {
  const [b, setB] = useState(String(budget));
  const [r, setR] = useState(String(rate));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Ustawienia budżetu</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Całkowity budżet (PLN)</label>
            <input className="input" type="number" value={b} onChange={(e) => setB(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Kurs wymiany (1 JPY = ? PLN)</label>
            <input className="input" type="number" step="0.001" value={r} onChange={(e) => setR(e.target.value)} />
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Kurs aktualizuje się automatycznie. Ręczna zmiana nadpisze auto-kurs.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Anuluj</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onSave(parseFloat(b) || budget, parseFloat(r) || rate)}>
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
