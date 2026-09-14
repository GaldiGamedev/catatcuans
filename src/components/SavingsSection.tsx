import React, { useState } from 'react';
import { PiggyBank, Plus, Sparkles, Trophy, Calendar, ArrowUpRight, ArrowDownLeft, Trash2, X } from 'lucide-react';
import { SavingsGoal, Wallet } from '../types';
import { formatRupiah, parseNumberInput, formatDate } from '../utils/formatters';
import { DynamicIcon } from './DynamicIcon';
import { showConfirmDialog, showToast, showSuccessAlert } from '../utils/sweetalert';

interface SavingsSectionProps {
  savings: SavingsGoal[];
  wallets: Wallet[];
  onSaveSaving: (saving: SavingsGoal) => void;
  onDeleteSaving: (savingId: string) => void;
  onDepositSaving: (savingId: string, amount: number, sourceWalletId?: string) => void;
  onWithdrawSaving: (savingId: string, amount: number, destWalletId?: string) => void;
}

const PRESET_ICONS = ['PiggyBank', 'Laptop', 'Smartphone', 'Car', 'Home', 'Plane', 'GraduationCap', 'Gift', 'Heart', 'ShieldCheck'];
const PRESET_COLORS = ['#10b981', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#06b6d4'];

export const SavingsSection: React.FC<SavingsSectionProps> = ({
  savings,
  wallets,
  onSaveSaving,
  onDeleteSaving,
  onDepositSaving,
  onWithdrawSaving,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [actionMode, setActionMode] = useState<'deposit' | 'withdraw'>('deposit');

  // Form State for New Goal
  const [name, setName] = useState('');
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [initialAmountInput, setInitialAmountInput] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('PiggyBank');
  const [selectedColor, setSelectedColor] = useState('#10b981');

  // Action State (Deposit/Withdraw)
  const [actionAmountInput, setActionAmountInput] = useState('');
  const [actionWalletId, setActionWalletId] = useState(wallets[0]?.id || '');

  const handleOpenAdd = () => {
    setName('');
    setTargetAmountInput('');
    setInitialAmountInput('0');
    setTargetDate('');
    setSelectedIcon('PiggyBank');
    setSelectedColor('#10b981');
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseNumberInput(targetAmountInput);
    const initial = parseNumberInput(initialAmountInput);

    if (!name.trim()) {
      showToast('Masukkan nama impian / celengan', 'error');
      return;
    }
    if (target <= 0) {
      showToast('Masukkan target nominal tabungan', 'error');
      return;
    }

    const newGoal: SavingsGoal = {
      id: `save-${Date.now()}`,
      name: name.trim(),
      targetAmount: target,
      currentAmount: Math.min(target, initial),
      targetDate: targetDate || undefined,
      icon: selectedIcon,
      color: selectedColor,
    };

    onSaveSaving(newGoal);
    setIsAddModalOpen(false);
    showToast('Target celengan impian berhasil dibuat! 🎯', 'success');
  };

  const handleOpenAction = (goal: SavingsGoal, mode: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setActionMode(mode);
    setActionAmountInput('');
    setActionWalletId(wallets[0]?.id || '');
    setIsActionModalOpen(true);
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseNumberInput(actionAmountInput);

    if (amount <= 0) {
      showToast('Masukkan nominal yang valid', 'error');
      return;
    }

    if (actionMode === 'deposit') {
      onDepositSaving(selectedGoal.id, amount, actionWalletId);
      const newTotal = selectedGoal.currentAmount + amount;
      if (newTotal >= selectedGoal.targetAmount) {
        showSuccessAlert('Selamat! Target Tercapai! 🎉', `Celengan "${selectedGoal.name}" telah mencapai 100% target!`);
      } else {
        showToast(`Berhasil menabung ${formatRupiah(amount)} ke "${selectedGoal.name}"!`, 'success');
      }
    } else {
      if (amount > selectedGoal.currentAmount) {
        showToast('Nominal penarikan melebihi saldo celengan', 'error');
        return;
      }
      onWithdrawSaving(selectedGoal.id, amount, actionWalletId);
      showToast(`Berhasil menarik ${formatRupiah(amount)} dari "${selectedGoal.name}"`, 'info');
    }

    setIsActionModalOpen(false);
  };

  const handleDeleteGoal = async (goal: SavingsGoal) => {
    const ok = await showConfirmDialog(
      'Hapus Celengan Impian?',
      `Target "${goal.name}" akan dihapus.`,
      'Ya, Hapus',
      true
    );
    if (ok) {
      onDeleteSaving(goal.id);
      showToast('Celengan berhasil dihapus', 'info');
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Soft Glow */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Celengan & Target Impian</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Wishlist
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Alokasikan uang untuk dana darurat, wishlist belanja, atau liburan
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-indigo-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Celengan Baru</span>
        </button>
      </div>

      {/* Savings Goal Cards */}
      {savings.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800">
          <PiggyBank className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Belum ada celengan impian</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Yuk buat target tabungan untuk barang idaman, dana darurat, atau liburan bersama keluarga!
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
          >
            + Buat Celengan Impian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {savings.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden"
              >
                {isCompleted && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Tercapai!
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${goal.color || '#6366f1'}22`, color: goal.color || '#6366f1' }}
                      >
                        <DynamicIcon name={goal.icon || 'PiggyBank'} className="w-5 h-5" />
                      </div>
                      <div className="truncate pr-16">
                        <h4 className="text-sm font-bold text-white truncate">{goal.name}</h4>
                        {goal.targetDate && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>Target: {formatDate(goal.targetDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal)}
                      title="Hapus Celengan"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between mt-3 mb-1">
                    <span className="text-base font-bold text-white">
                      {formatRupiah(goal.currentAmount)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      dari {formatRupiah(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-800/90 overflow-hidden my-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-medium">
                    <span className="text-indigo-400 font-bold">{percent}% tercapai</span>
                    <span>
                      {isCompleted ? (
                        <span className="text-emerald-400 font-bold">Lunas Terkumpul! 🎉</span>
                      ) : (
                        <span>Kurang {formatRupiah(remaining)}</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions: Tabung & Tarik */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenAction(goal, 'deposit')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>+ Tabung Sekarang</span>
                  </button>

                  <button
                    onClick={() => handleOpenAction(goal, 'withdraw')}
                    disabled={goal.currentAmount <= 0}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1 border border-slate-700 transition-all active:scale-95"
                    title="Tarik dana celengan ke dompet"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Tarik</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add New Savings Goal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Buat Target Celengan Impian</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                data-sound="cancel"
                aria-label="Tutup dan Batalkan"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Celengan / Impian
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli Laptop Baru / Dana Darurat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 5.000.000"
                    value={targetAmountInput}
                    onChange={(e) => {
                      const num = parseNumberInput(e.target.value);
                      setTargetAmountInput(num > 0 ? num.toLocaleString('id-ID') : '');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={initialAmountInput}
                    onChange={(e) => {
                      const num = parseNumberInput(e.target.value);
                      setInitialAmountInput(num > 0 ? num.toLocaleString('id-ID') : '0');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Batas Waktu / Target Tanggal (Opsional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Icon & Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pilih Ikon
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        selectedIcon === iconName
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <DynamicIcon name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950"
                >
                  Buat Celengan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Deposit / Withdraw Action */}
      {isActionModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                {actionMode === 'deposit' ? (
                  <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="text-base font-bold text-white">
                  {actionMode === 'deposit' ? 'Setor / Nabung ke Celengan' : 'Tarik Dana dari Celengan'}
                </h3>
              </div>
              <button
                onClick={() => setIsActionModalOpen(false)}
                data-sound="cancel"
                aria-label="Tutup dan Batalkan"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 mb-4">
              <div className="text-xs text-slate-400 font-medium">Celengan:</div>
              <div className="text-sm font-bold text-white flex items-center justify-between mt-0.5">
                <span>{selectedGoal.name}</span>
                <span className="text-indigo-400">{formatRupiah(selectedGoal.currentAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nominal {actionMode === 'deposit' ? 'Setoran' : 'Penarikan'} (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="Contoh: 100.000"
                    value={actionAmountInput}
                    onChange={(e) => {
                      const num = parseNumberInput(e.target.value);
                      setActionAmountInput(num > 0 ? num.toLocaleString('id-ID') : '');
                    }}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {actionMode === 'deposit' ? 'Diambil Dari Dompet' : 'Ditransfer Ke Dompet'}
                </label>
                <select
                  value={actionWalletId}
                  onChange={(e) => setActionWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: {formatRupiah(w.currentBalance ?? w.initialBalance)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Saldo dompet yang dipilih akan otomatis disesuaikan secara real-time.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg ${
                    actionMode === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950'
                  }`}
                >
                  Konfirmasi {actionMode === 'deposit' ? 'Nabung' : 'Tarik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
