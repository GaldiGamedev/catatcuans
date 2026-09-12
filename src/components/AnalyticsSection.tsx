import React, { useState } from 'react';
import {
  PieChart,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';

interface AnalyticsSectionProps {
  transactions: Transaction[];
}

const EXPENSE_PALETTE = [
  '#f97316', '#06b6d4', '#ec4899', '#eab308', '#3b82f6', '#a855f7', '#10b981', '#64748b'
];

const INCOME_PALETTE = [
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#84cc16'
];

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Compute total expenses by category
  const expenseByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    for (const tx of transactions) {
      if (tx.type === 'expense') {
        const cat = tx.category || 'Lainnya';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
        total += tx.amount;
      }
    }

    const items = Array.from(map.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: EXPENSE_PALETTE[index % EXPENSE_PALETTE.length],
      }))
      .sort((a, b) => b.amount - a.amount);

    return { items, total };
  }, [transactions]);

  // Compute total income by category (Fitur Analisis Pendapatan)
  const incomeByCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        const cat = tx.category || 'Lainnya';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
        total += tx.amount;
      }
    }

    const items = Array.from(map.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: INCOME_PALETTE[index % INCOME_PALETTE.length],
      }))
      .sort((a, b) => b.amount - a.amount);

    return { items, total };
  }, [transactions]);

  // Compute total income vs expense
  const stats = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    let adminFees = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expense += tx.amount;
      if (tx.type === 'transfer' && tx.adminFee) adminFees += tx.adminFee;
    }

    const totalOut = expense + adminFees;
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - totalOut) / income) * 100)) : 0;

    return { income, expense, adminFees, totalOut, savingsRate };
  }, [transactions]);

  const currentDataset = activeTab === 'expense' ? expenseByCategory : incomeByCategory;

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-4 sm:p-6 shadow-xl backdrop-blur-sm space-y-5">
      {/* Header with Title & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-400" />
          <span>Analisis Keuangan</span>
        </h2>

        {/* Tab Toggle: Pengeluaran vs Pendapatan */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pendapatan</span>
          </button>
        </div>
      </div>

      {/* Overview Total of Active Tab */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-400 font-medium">
          {activeTab === 'expense' ? 'Total Dana Keluar' : 'Total Sumber Pendapatan'}
        </span>
        <span
          className={`text-sm font-bold ${
            activeTab === 'expense' ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {activeTab === 'expense' ? '-' : '+'}
          {formatRupiah(currentDataset.total)}
        </span>
      </div>

      {currentDataset.items.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Belum ada catatan {activeTab === 'expense' ? 'pengeluaran' : 'pendapatan'} untuk dianalisis.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Visual Percentage Bar (Multi-color segmented bar - super lightweight for low-end phones) */}
          <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden flex p-0.5 border border-slate-800">
            {currentDataset.items.map((item) => (
              <div
                key={item.name}
                style={{
                  width: `${Math.max(item.percentage, 2)}%`,
                  backgroundColor: item.color,
                }}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                title={`${item.name}: ${item.percentage.toFixed(1)}% (${formatRupiah(item.amount)})`}
              />
            ))}
          </div>

          {/* Top Source Highlight if Income */}
          {activeTab === 'income' && currentDataset.items[0] && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sumber Cuan Terbesar:</span>
              </span>
              <span className="font-bold text-white">
                {currentDataset.items[0].name} ({currentDataset.items[0].percentage.toFixed(0)}%)
              </span>
            </div>
          )}

          {/* Breakdown Items List */}
          <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
            {currentDataset.items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 text-xs hover:border-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-200 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-slate-400 font-semibold">{item.percentage.toFixed(1)}%</span>
                  <span
                    className={`font-bold ${
                      activeTab === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatRupiah(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Health / Savings Ratio Indicator */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950/30 border border-indigo-500/20 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tingkat Tabungan (Savings Rate)</span>
          </span>
          <span className="font-bold text-emerald-400 text-sm">{stats.savingsRate}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(stats.savingsRate, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
          {stats.savingsRate >= 30
            ? '🔥 Luar biasa! Anda berhasil menabung lebih dari 30% dari pemasukan.'
            : stats.savingsRate > 0
            ? '👍 Keuangan Anda masih surplus. Terus batasi pengeluaran non-prioritas.'
            : '⚠️ Pengeluaran mendekati atau melebihi pemasukan. Waktunya berhemat!'}
        </p>
      </div>
    </div>
  );
};

