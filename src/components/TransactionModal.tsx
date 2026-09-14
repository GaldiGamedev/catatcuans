import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  FileText,
  Wallet as WalletIcon,
  Tag,
  Check,
  Coins,
} from 'lucide-react';
import { Transaction, TransactionType, Wallet, Category } from '../types';
import { formatRupiah, getTodayDateString, parseNumberInput } from '../utils/formatters';
import {
  showToast,
  showErrorAlert,
  showInsufficientBalanceWarning,
} from '../utils/sweetalert';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  onSaveTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  defaultType?: TransactionType;
  defaultSourceWalletId?: string;
  defaultAdminFee?: number;
  onOpenCategoryModal?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  categories,
  onSaveTransaction,
  defaultType = 'expense',
  defaultSourceWalletId,
  defaultAdminFee = 0,
  onOpenCategoryModal,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [adminFeeInput, setAdminFeeInput] = useState<string>(String(defaultAdminFee));
  const [date, setDate] = useState<string>(getTodayDateString());
  const [note, setNote] = useState<string>('');

  // Sync defaults on open
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      const initialWallet = defaultSourceWalletId || (wallets[0]?.id ?? '');
      setWalletId(initialWallet);

      // Default target wallet for transfer (different from source)
      const secondWallet = wallets.find((w) => w.id !== initialWallet);
      setToWalletId(secondWallet?.id || '');

      setAmountInput('');
      setAdminFeeInput(String(defaultAdminFee || 0));
      setDate(getTodayDateString());
      setNote('');

      // Auto set first matching category
      const firstCat = categories.find((c) => c.type === (defaultType === 'income' ? 'income' : 'expense'));
      setCategory(firstCat ? firstCat.name : '');
    }
  }, [isOpen, defaultType, defaultSourceWalletId, wallets, categories]);

  // When type changes, adjust category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'transfer') {
      setCategory('Transfer Antar Dompet');
    } else {
      const match = categories.find((c) => c.type === newType);
      setCategory(match ? match.name : '');
    }
  };

  if (!isOpen) return null;

  const currentAmount = parseNumberInput(amountInput);
  const currentAdminFee = parseNumberInput(adminFeeInput);
  const selectedWallet = wallets.find((w) => w.id === walletId);
  const selectedToWallet = wallets.find((w) => w.id === toWalletId);

  // Quick Amount adders
  const addAmount = (addon: number) => {
    const current = parseNumberInput(amountInput);
    setAmountInput(String(current + addon));
  };

  // Quick preset fees for transfer
  const setPresetFee = (fee: number) => {
    setAdminFeeInput(String(fee));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletId) {
      showErrorAlert('Pilih Dompet', 'Harap pilih dompet yang digunakan.');
      return;
    }

    if (currentAmount <= 0) {
      showErrorAlert('Nominal Kosong', 'Harap masukkan nominal transaksi lebih dari Rp 0.');
      return;
    }

    if (type === 'transfer') {
      if (!toWalletId) {
        showErrorAlert('Dompet Tujuan', 'Harap pilih dompet tujuan transfer.');
        return;
      }
      if (walletId === toWalletId) {
        showErrorAlert('Dompet Sama', 'Dompet asal dan dompet tujuan transfer tidak boleh sama.');
        return;
      }
    }

    // Check balance if expense or transfer
    if (selectedWallet && (type === 'expense' || type === 'transfer')) {
      const requiredDeduction = type === 'transfer' ? currentAmount + currentAdminFee : currentAmount;
      const walletBalance = selectedWallet.currentBalance ?? selectedWallet.initialBalance;

      if (walletBalance < requiredDeduction) {
        const confirmMinus = await showInsufficientBalanceWarning(
          selectedWallet.name,
          formatRupiah(walletBalance),
          formatRupiah(requiredDeduction)
        );
        if (!confirmMinus) {
          return;
        }
      }
    }

    // Save transaction
    onSaveTransaction({
      type,
      amount: currentAmount,
      adminFee: type === 'transfer' ? currentAdminFee : undefined,
      category: type === 'transfer' ? 'Transfer Antar Dompet' : category || 'Lainnya',
      walletId,
      toWalletId: type === 'transfer' ? toWalletId : undefined,
      date,
      note: note.trim() || undefined,
    });

    showToast(
      type === 'transfer'
        ? `Transfer ${formatRupiah(currentAmount)} berhasil dicatat!`
        : `Transaksi ${formatRupiah(currentAmount)} berhasil disimpan!`,
      'success'
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Catat Transaksi Baru</span>
          </h2>
          <button
            onClick={onClose}
            data-sound="cancel"
            aria-label="Tutup dan Batalkan"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            {/* Expense Tab */}
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>Pengeluaran</span>
            </button>

            {/* Income Tab */}
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Pemasukan</span>
            </button>

            {/* Transfer Tab */}
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                type === 'transfer'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-purple-400" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nominal Input Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nominal Transaksi (Rp) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-lg font-bold text-slate-400">Rp</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="0"
                value={amountInput ? Number(amountInput).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAmountInput(val);
                }}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl text-xl sm:text-2xl font-bold text-white tracking-wide placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10000, 25000, 50000, 100000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addAmount(val)}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                >
                  +{formatRupiah(val)}
                </button>
              ))}
              {amountInput && (
                <button
                  type="button"
                  onClick={() => setAmountInput('')}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          {/* Wallets Selection: Standard or Transfer */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-2xl border border-purple-500/20">
              {/* Source Wallet */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Dompet Asal (Dari)</span>
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-purple-500 outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.currentBalance ?? w.initialBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Wallet */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dompet Tujuan (Ke)
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-purple-500 outline-none"
                >
                  <option value="" disabled>Pilih dompet tujuan...</option>
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.currentBalance ?? w.initialBalance)})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>
                  {type === 'expense' ? 'Sumber Pembayaran (Dompet)' : 'Disimpan Ke (Dompet)'}
                </span>
                {selectedWallet && (
                  <span className="text-slate-400 font-normal">
                    Saldo: <strong className="text-emerald-400">{formatRupiah(selectedWallet.currentBalance ?? selectedWallet.initialBalance)}</strong>
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-4 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white focus:border-emerald-500 outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.currentBalance ?? w.initialBalance)})
                    </option>
                  ))}
                </select>
                <WalletIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Transfer Admin Fee Section (Specific requested feature!) */}
          {type === 'transfer' && (
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Biaya Admin Transfer</span>
                </label>
                <span className="text-xs font-bold text-amber-400">
                  {formatRupiah(currentAdminFee)}
                </span>
              </div>

              {/* Admin Fee Presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Gratis', fee: 0 },
                  { label: 'Rp 1.000', fee: 1000 },
                  { label: 'Rp 2.500 (BI-Fast)', fee: 2500 },
                  { label: 'Rp 6.500 (Online)', fee: 6500 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPresetFee(preset.fee)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border transition-all text-center ${
                      currentAdminFee === preset.fee
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Admin Fee Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400">Atau nominal custom:</span>
                <input
                  type="text"
                  placeholder="0"
                  value={adminFeeInput ? Number(adminFeeInput).toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAdminFeeInput(val);
                  }}
                  className="w-32 py-1 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Total deduction calculation */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total terpotong dari dompet asal:</span>
                <span className="font-bold text-rose-400">
                  {formatRupiah(currentAmount + currentAdminFee)}
                </span>
              </div>
            </div>
          )}

          {/* Category selection (Hidden if transfer, as transfer is internal movement) */}
          {type !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Kategori Transaksi
                </label>
                {onOpenCategoryModal && (
                  <button
                    type="button"
                    onClick={onOpenCategoryModal}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Kelola Kategori
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-4 bg-slate-950 border border-slate-700 rounded-2xl text-sm text-white focus:border-emerald-500 outline-none"
                >
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  <option value="Lain-lain">Lain-lain</option>
                </select>
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Date & Note Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tanggal Transaksi
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Note / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Catatan / Keterangan (Opsional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Makan siang, ongkos..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-2xl font-bold text-sm text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                type === 'expense'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-950/40'
                  : type === 'income'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/40'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                Simpan{' '}
                {type === 'expense'
                  ? 'Pengeluaran'
                  : type === 'income'
                  ? 'Pemasukan'
                  : 'Transfer'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
