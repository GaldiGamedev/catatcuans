import React, { useState } from 'react';
import { Zap, Plus, Utensils, Coffee, Fuel, Smartphone, Trash2, X } from 'lucide-react';
import { QuickSpend, Category, Wallet, Transaction } from '../types';
import { formatRupiah, parseNumberInput } from '../utils/formatters';
import { DynamicIcon } from './DynamicIcon';
import { showToast, showConfirmDialog } from '../utils/sweetalert';

interface QuickSpendsBarProps {
  quickSpends: QuickSpend[];
  wallets: Wallet[];
  categories: Category[];
  onLogQuickSpend: (qs: QuickSpend) => void;
  onAddQuickSpend: (qs: QuickSpend) => void;
  onDeleteQuickSpend: (id: string) => void;
}

export const QuickSpendsBar: React.FC<QuickSpendsBarProps> = ({
  quickSpends,
  wallets,
  categories,
  onLogQuickSpend,
  onAddQuickSpend,
  onDeleteQuickSpend,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [categoryName, setCategoryName] = useState(categories[0]?.name || 'Makanan & Minuman');
  const [icon, setIcon] = useState('Utensils');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleOpenAdd = () => {
    setName('');
    setAmountInput('');
    setCategoryName(expenseCategories[0]?.name || 'Makanan & Minuman');
    setIcon('Utensils');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberInput(amountInput);
    if (!name.trim()) {
      showToast('Masukkan nama pengeluaran rutin', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('Masukkan nominal pengeluaran yang valid', 'error');
      return;
    }

    const newQS: QuickSpend = {
      id: `qs-${Date.now()}`,
      name: name.trim(),
      amount,
      category: categoryName,
      icon,
    };

    onAddQuickSpend(newQS);
    setIsModalOpen(false);
    showToast('Pintasan pengeluaran cepat ditambahkan!', 'success');
  };

  const handleDelete = async (e: React.MouseEvent, qs: QuickSpend) => {
    e.stopPropagation();
    const ok = await showConfirmDialog(
      'Hapus Pintasan?',
      `Pintasan "${qs.name}" akan dihapus.`,
      'Ya, Hapus',
      true
    );
    if (ok) {
      onDeleteQuickSpend(qs.id);
      showToast('Pintasan dihapus', 'info');
    }
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Pintasan Pengeluaran Cepat (1-Klik Catat)</span>
        </div>
        <button
          onClick={handleOpenAdd}
          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Pintasan</span>
        </button>
      </div>

      {quickSpends.length === 0 ? (
        <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-300">Belum ada pintasan pengeluaran</div>
              <div className="text-[11px] text-slate-500">Buat tombol 1-klik untuk pengeluaran rutin (misal kopi, bensin, parkir)</div>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pintasan</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
          {quickSpends.map((qs) => (
            <div
              key={qs.id}
              onClick={() => onLogQuickSpend(qs)}
              role="button"
              tabIndex={0}
              className="group shrink-0 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800/90 hover:border-emerald-500/40 text-left transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <DynamicIcon name={qs.icon || 'Zap'} className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                  <span>{qs.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-semibold">
                  {formatRupiah(qs.amount)}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, qs)}
                title="Hapus Pintasan"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            onClick={handleOpenAdd}
            className="shrink-0 px-3 py-2 rounded-2xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Baru</span>
          </button>
        </div>
      )}

      {/* Modal Add Quick Spend */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Buat Pintasan Pengeluaran Cepat</h3>
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Pintasan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kopi Pagi / Bensin Motor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nominal Pengeluaran (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 20.000"
                  value={amountInput}
                  onChange={(e) => {
                    const num = parseNumberInput(e.target.value);
                    setAmountInput(num > 0 ? num.toLocaleString('id-ID') : '');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori
                </label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
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
                  Pilih Ikon
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Utensils', 'Coffee', 'Fuel', 'Smartphone', 'Receipt', 'ShoppingBag', 'Gamepad2', 'Coins'].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        icon === ic
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <DynamicIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950"
                >
                  Simpan Pintasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
