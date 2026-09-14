import React, { useState, useMemo } from 'react';
import { Target, Plus, AlertTriangle, CheckCircle2, ChevronRight, X, Trash2, TrendingDown, Tag } from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import { formatRupiah, parseNumberInput } from '../utils/formatters';
import { DynamicIcon } from './DynamicIcon';
import { showConfirmDialog, showToast } from '../utils/sweetalert';

interface BudgetSectionProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: string) => void;
  onOpenCategoryModal?: () => void;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  budgets,
  categories,
  transactions,
  onSaveBudget,
  onDeleteBudget,
  onOpenCategoryModal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form state
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [monthlyLimitInput, setMonthlyLimitInput] = useState('');

  // Calculate expense for current month per category
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthExpensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthKey)) {
        const cat = tx.category || 'Lainnya';
        map.set(cat, (map.get(cat) || 0) + tx.amount);
      }
    }
    return map;
  }, [transactions, currentMonthKey]);

  // Overall budget summary
  const summary = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;

    for (const b of budgets) {
      totalBudget += b.monthlyLimit;
      const spent = currentMonthExpensesByCategory.get(b.categoryName) || 0;
      totalSpent += spent;
    }

    const percent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
    const remaining = totalBudget - totalSpent;

    return { totalBudget, totalSpent, percent, remaining };
  }, [budgets, currentMonthExpensesByCategory]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleOpenAdd = () => {
    setEditingBudget(null);
    const firstCat = expenseCategories.find((c) => !budgets.some((b) => b.categoryName === c.name));
    setSelectedCategoryName(firstCat ? firstCat.name : (expenseCategories[0]?.name || ''));
    setMonthlyLimitInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setSelectedCategoryName(b.categoryName);
    setMonthlyLimitInput(b.monthlyLimit.toLocaleString('id-ID'));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseNumberInput(monthlyLimitInput);
    if (!selectedCategoryName) {
      showToast('Pilih kategori anggaran terlebih dahulu', 'error');
      return;
    }
    if (limit <= 0) {
      showToast('Masukkan batas nominal anggaran yang valid', 'error');
      return;
    }

    const matchedCat = categories.find((c) => c.name === selectedCategoryName);

    const newBudget: Budget = {
      id: editingBudget ? editingBudget.id : `b-${Date.now()}`,
      categoryId: matchedCat?.id || `cat-${Date.now()}`,
      categoryName: selectedCategoryName,
      monthlyLimit: limit,
      icon: matchedCat?.icon || 'Target',
      color: matchedCat?.color || '#10b981',
    };

    onSaveBudget(newBudget);
    setIsModalOpen(false);
    showToast(editingBudget ? 'Anggaran diperbarui!' : 'Target anggaran baru disimpan!', 'success');
  };

  const handleDelete = async (b: Budget) => {
    const ok = await showConfirmDialog(
      'Hapus Target Anggaran?',
      `Batas anggaran untuk kategori "${b.categoryName}" akan dihapus.`,
      'Ya, Hapus',
      true
    );
    if (ok) {
      onDeleteBudget(b.id);
      showToast('Anggaran berhasil dihapus', 'info');
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background soft glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Target Anggaran Bulanan</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Bulan Ini
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Pantau batas aman pengeluaran agar tidak boros atau defisit
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Atur Anggaran Baru</span>
        </button>
      </div>

      {/* Overall Budget Bar - only shown when there are active budgets */}
      {budgets.length > 0 ? (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs text-slate-400 font-medium">Realisasi Anggaran Total</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {formatRupiah(summary.totalSpent)} / {formatRupiah(summary.totalBudget)}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                  summary.percent > 90
                    ? 'bg-rose-500/20 text-rose-400'
                    : summary.percent > 70
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {summary.percent}% Terpakai
              </span>
            </div>
          </div>

          {/* Outer bar */}
          <div className="w-full h-3 rounded-full bg-slate-800/90 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                summary.percent > 90
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : summary.percent > 70
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500'
              }`}
              style={{ width: `${summary.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>
              {summary.remaining >= 0 ? (
                <span className="text-emerald-400">Sisa aman dibelanjakan: {formatRupiah(summary.remaining)}</span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Melebihi anggaran sebesar {formatRupiah(Math.abs(summary.remaining))}
                </span>
              )}
            </span>
            <span>{budgets.length} Kategori Dibatasi</span>
          </div>
        </div>
      ) : null}

      {/* Category Budget Items */}
      {budgets.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-3xl bg-slate-950/50 border border-dashed border-slate-800/90">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm sm:text-base font-bold text-white">Target Anggaran Mulai dari Nol (0)</p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Belum ada batas anggaran pengeluaran yang diatur. Anda dapat memasang batas limit bulanan per kategori untuk mengendalikan arus kas sesuai kebutuhan.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Atur Anggaran Pertama</span>
            </button>
            {onOpenCategoryModal && (
              <button
                onClick={onOpenCategoryModal}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Kelola Kategori</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {budgets.map((b) => {
            const spent = currentMonthExpensesByCategory.get(b.categoryName) || 0;
            const percent = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));
            const isOver = spent > b.monthlyLimit;
            const remaining = b.monthlyLimit - spent;

            return (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${b.color || '#10b981'}22`, color: b.color || '#10b981' }}
                    >
                      <DynamicIcon name={b.icon || 'Target'} className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate">{b.categoryName}</h4>
                      <p className="text-[11px] text-slate-400">
                        Batas: <span className="text-slate-300 font-semibold">{formatRupiah(b.monthlyLimit)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      title="Edit Anggaran"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      title="Hapus Anggaran"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden my-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver
                        ? 'bg-rose-500'
                        : percent > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] mt-1 font-medium">
                  <span className="text-slate-400">
                    Pakai: <span className="text-white font-semibold">{formatRupiah(spent)}</span> ({percent}%)
                  </span>
                  <span>
                    {isOver ? (
                      <span className="text-rose-400 font-bold">Lewat {formatRupiah(Math.abs(remaining))}</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Sisa {formatRupiah(remaining)}</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add/Edit Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingBudget ? 'Ubah Batas Anggaran' : 'Pasang Anggaran Kategori'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                data-sound="cancel"
                aria-label="Tutup dan Batalkan"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori Pengeluaran
                </label>
                <select
                  value={selectedCategoryName}
                  onChange={(e) => setSelectedCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Batas Pengeluaran Bulanan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 1.500.000"
                    value={monthlyLimitInput}
                    onChange={(e) => {
                      const num = parseNumberInput(e.target.value);
                      setMonthlyLimitInput(num > 0 ? num.toLocaleString('id-ID') : '');
                    }}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  CatatCuan akan memberi peringatan jika pengeluaran kategori ini mendekati batas.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
