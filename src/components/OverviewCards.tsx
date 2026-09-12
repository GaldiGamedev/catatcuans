import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface OverviewCardsProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalAdminFees: number;
  transactionCount: number;
  privacyMode?: boolean;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  totalBalance,
  totalIncome,
  totalExpense,
  totalAdminFees,
  transactionCount,
  privacyMode = false,
}) => {
  const netCashflow = totalIncome - (totalExpense + totalAdminFees);

  const displayAmount = (val: number, prefix: string = '') => {
    if (privacyMode) return 'Rp ••••••';
    return `${prefix}${formatRupiah(val)}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Saldo Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-4 sm:p-5 border border-indigo-500/20 shadow-xl shadow-indigo-950/20">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400">Total Saldo Terkumpul</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {displayAmount(totalBalance)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Semua dompet aktif</span>
        </div>
      </div>

      {/* Total Pemasukan Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-4 sm:p-5 border border-emerald-500/20 shadow-xl shadow-emerald-950/20">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-emerald-400/90">Total Pemasukan</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
          {displayAmount(totalIncome, '+')}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-emerald-500/80">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Dana Masuk</span>
        </div>
      </div>

      {/* Total Pengeluaran Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 p-4 sm:p-5 border border-rose-500/20 shadow-xl shadow-rose-950/20">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-rose-400/90">Total Pengeluaran</span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-rose-400 tracking-tight">
          {displayAmount(totalExpense, '-')}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-rose-400/80">
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Dana Keluar</span>
          </span>
          {totalAdminFees > 0 && !privacyMode && (
            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
              + Admin {formatRupiah(totalAdminFees)}
            </span>
          )}
        </div>
      </div>

      {/* Net Arus Kas / Status Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30 p-4 sm:p-5 border border-teal-500/20 shadow-xl shadow-teal-950/20">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-teal-400/90">Arus Kas Bersih (Net)</span>
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-bold tracking-tight ${netCashflow >= 0 ? 'text-teal-300' : 'text-amber-400'}`}>
          {privacyMode ? 'Rp ••••••' : `${netCashflow >= 0 ? '+' : ''}${formatRupiah(netCashflow)}`}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{transactionCount} transaksi dicatat</span>
          <span className={`font-medium ${netCashflow >= 0 ? 'text-teal-400' : 'text-amber-400'}`}>
            {netCashflow >= 0 ? 'Surplus' : 'Defisit'}
          </span>
        </div>
      </div>
    </div>
  );
};
