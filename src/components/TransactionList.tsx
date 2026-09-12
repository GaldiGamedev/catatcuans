import React, { useState } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Trash2,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  Clock,
  Coins,
} from 'lucide-react';
import { Transaction, TransactionType, Wallet, DateFilter } from '../types';
import { formatDate, formatRupiah } from '../utils/formatters';
import { showConfirmDialog, showToast } from '../utils/sweetalert';

interface TransactionListProps {
  transactions: Transaction[];
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelectWallet: (walletId: string | null) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenNewTransaction: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  wallets,
  selectedWalletId,
  onSelectWallet,
  onDeleteTransaction,
  onOpenNewTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');

  const walletMap = React.useMemo(() => {
    const map = new Map<string, Wallet>();
    wallets.forEach((w) => map.set(w.id, w));
    return map;
  }, [wallets]);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Wallet filter
    if (selectedWalletId) {
      if (tx.type === 'transfer') {
        if (tx.walletId !== selectedWalletId && tx.toWalletId !== selectedWalletId) {
          return false;
        }
      } else {
        if (tx.walletId !== selectedWalletId) {
          return false;
        }
      }
    }

    // Type filter
    if (selectedType !== 'all' && tx.type !== selectedType) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = tx.note?.toLowerCase().includes(q);
      const matchCategory = tx.category.toLowerCase().includes(q);
      const sourceWallet = walletMap.get(tx.walletId)?.name.toLowerCase().includes(q);
      const targetWallet = tx.toWalletId ? walletMap.get(tx.toWalletId)?.name.toLowerCase().includes(q) : false;

      if (!matchNote && !matchCategory && !sourceWallet && !targetWallet) {
        return false;
      }
    }

    // Date filter
    if (selectedDateFilter !== 'all') {
      const txDate = new Date(tx.date);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (selectedDateFilter === 'today') {
        if (txDate.toDateString() !== now.toDateString()) return false;
      } else if (selectedDateFilter === 'this_week') {
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (txDate < weekAgo) return false;
      } else if (selectedDateFilter === 'this_month') {
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }
    }

    return true;
  });

  const handleDelete = async (tx: Transaction) => {
    const confirmed = await showConfirmDialog(
      'Hapus Transaksi Ini?',
      `Transaksi ${tx.type === 'transfer' ? 'Transfer' : tx.category} sebesar ${formatRupiah(tx.amount)} akan dihapus dan saldo dompet akan dikalkulasi ulang.`,
      'Ya, Hapus',
      true
    );

    if (confirmed) {
      onDeleteTransaction(tx.id);
      showToast('Transaksi berhasil dihapus!', 'info');
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-4 sm:p-6 shadow-xl backdrop-blur-sm">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Riwayat Transaksi</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredTransactions.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Semua catatan arus kas tersimpan aman di browser Anda
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari transaksi / catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs: Type & Date */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5 pb-3 border-b border-slate-800/60">
        {/* Type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'expense', label: 'Pengeluaran' },
            { id: 'income', label: 'Pemasukan' },
            { id: 'transfer', label: 'Transfer' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedType === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter Selection */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/60">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 hidden sm:block" />
          {[
            { id: 'all', label: 'Semua Waktu' },
            { id: 'today', label: 'Hari ini' },
            { id: 'this_week', label: '7 Hari' },
            { id: 'this_month', label: 'Bulan Ini' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDateFilter(d.id as DateFilter)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors shrink-0 ${
                selectedDateFilter === d.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter notification if wallet selected */}
      {selectedWalletId && (
        <div className="mb-4 flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <span>
            Menampilkan transaksi untuk dompet:{' '}
            <strong>{walletMap.get(selectedWalletId)?.name || 'Dompet'}</strong>
          </span>
          <button
            onClick={() => onSelectWallet(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold underline"
          >
            Hapus Filter
          </button>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-slate-200 text-sm font-bold mb-1">
            {transactions.length === 0
              ? 'Selamat Datang di CatatCuan! 🚀'
              : 'Belum ada transaksi yang sesuai kriteria'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
            {transactions.length === 0
              ? 'Pembukuan Anda masih bersih dimulai dari Rp 0. Mulai catat pemasukan pertama, uang saku, atau saldo awal dompet Anda sekarang.'
              : 'Silakan ubah filter kategori, dompet, atau rentang tanggal di atas.'}
          </p>
          <button
            onClick={onOpenNewTransaction}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
          >
            + Catat Transaksi Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const isExpense = tx.type === 'expense';
            const isTransfer = tx.type === 'transfer';

            const sourceWallet = walletMap.get(tx.walletId);
            const targetWallet = tx.toWalletId ? walletMap.get(tx.toWalletId) : null;

            return (
              <div
                key={tx.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-950/40 hover:bg-slate-850/60 border border-slate-800/60 hover:border-slate-700 transition-all duration-150 gap-3"
              >
                {/* Left: Type Icon & Details */}
                <div className="flex items-start sm:items-center gap-3">
                  {/* Icon Indicator */}
                  <div
                    className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                      isIncome
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : isExpense
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {isIncome && <ArrowDownLeft className="w-5 h-5" />}
                    {isExpense && <ArrowUpRight className="w-5 h-5" />}
                    {isTransfer && <ArrowRightLeft className="w-5 h-5" />}
                  </div>

                  {/* Title, Category, Wallet info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">
                        {isTransfer ? 'Transfer Antar Dompet' : tx.category}
                      </span>
                      {isTransfer ? (
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>{sourceWallet?.name || 'Asal'}</span>
                          <span className="text-purple-400 font-bold">→</span>
                          <span className="text-purple-300 font-semibold">{targetWallet?.name || 'Tujuan'}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <WalletIcon className="w-3 h-3 text-slate-500" />
                          <span>{sourceWallet?.name || 'Dompet'}</span>
                        </span>
                      )}
                    </div>

                    {/* Note & Date */}
                    <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-400">
                      <span className="text-slate-500">{formatDate(tx.date)}</span>
                      {tx.note && (
                        <>
                          <span className="text-slate-700">•</span>
                          <span className="text-slate-300 italic truncate max-w-[200px] sm:max-w-xs">
                            "{tx.note}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <div className="text-left sm:text-right">
                    <div
                      className={`text-sm sm:text-base font-bold tracking-tight ${
                        isIncome
                          ? 'text-emerald-400'
                          : isExpense
                          ? 'text-rose-400'
                          : 'text-purple-300'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatRupiah(tx.amount)}
                    </div>

                    {/* Show Admin Fee if transfer */}
                    {isTransfer && tx.adminFee !== undefined && tx.adminFee > 0 && (
                      <div className="text-[10px] text-amber-400 flex items-center sm:justify-end gap-1">
                        <Coins className="w-3 h-3" />
                        <span>Biaya Admin {formatRupiah(tx.adminFee)}</span>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(tx)}
                    title="Hapus transaksi"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
