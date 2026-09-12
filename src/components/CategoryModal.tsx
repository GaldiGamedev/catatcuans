import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, Check } from 'lucide-react';
import { Category } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { showToast, showConfirmDialog } from '../utils/sweetalert';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const CATEGORY_COLORS = [
  '#f97316', '#06b6d4', '#ec4899', '#eab308', '#3b82f6', '#a855f7', '#10b981', '#64748b'
];

const CATEGORY_ICONS = [
  'Utensils', 'Bus', 'ShoppingBag', 'Receipt', 'GraduationCap', 'Gamepad2',
  'Coins', 'Briefcase', 'Laptop', 'Gift', 'TrendingUp', 'HeartPulse', 'Coffee', 'Fuel'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      type: activeTab,
      color: selectedColor,
      icon: selectedIcon,
    });

    showToast(`Kategori "${newCatName}" berhasil ditambahkan!`, 'success');
    setNewCatName('');
  };

  const handleDelete = async (cat: Category) => {
    const confirmed = await showConfirmDialog(
      `Hapus Kategori "${cat.name}"?`,
      'Kategori ini tidak akan muncul lagi di pilihan transaksi baru.',
      'Hapus Kategori',
      true
    );

    if (confirmed) {
      onDeleteCategory(cat.id);
      showToast(`Kategori ${cat.name} dihapus.`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span>Kelola Kategori Transaksi</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pengeluaran ({categories.filter((c) => c.type === 'expense').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pemasukan ({categories.filter((c) => c.type === 'income').length})
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="text-xs font-bold text-slate-300">Tambah Kategori Baru</div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder={`Nama kategori ${activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'}...`}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 py-2 px-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:border-emerald-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            {/* Icon Picker Mini */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setSelectedIcon(ic)}
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs ${
                    selectedIcon === ic
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <DynamicIcon name={ic} className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            {/* Color Picker Mini */}
            <div className="flex items-center gap-2">
              {CATEGORY_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  style={{ backgroundColor: col }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    selectedColor === col ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : 'opacity-70'
                  }`}
                />
              ))}
            </div>
          </form>

          {/* List of Existing Categories */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">
              Daftar Kategori Tersedia
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/40 border border-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon || 'Tag'} className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
