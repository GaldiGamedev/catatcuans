import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  Edit2,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Category, Transaction } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { showToast, showConfirmDialog } from '../utils/sweetalert';
import { DEFAULT_CATEGORIES } from '../utils/storage';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  transactions?: Transaction[];
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onUpdateCategory?: (cat: Category, oldName: string) => void;
  onDeleteCategory: (id: string) => void;
  onResetCategories?: () => void;
}

const CATEGORY_COLORS = [
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#eab308', // Yellow
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#64748b', // Slate
];

const CATEGORY_ICONS = [
  // F&B & Daily
  'Utensils', 'Coffee', 'ShoppingBag', 'Shirt', 'Receipt',
  // Transport & Mobility
  'Bus', 'Car', 'Fuel', 'Plane',
  // Gadgets & Work
  'Laptop', 'Smartphone', 'Tv', 'Briefcase', 'GraduationCap', 'BookOpen',
  // Entertainment & Fun
  'Gamepad2', 'Music', 'Gift', 'Sparkles', 'Smile',
  // Finance & Growth
  'Coins', 'TrendingUp', 'Wallet', 'CreditCard', 'PiggyBank',
  // Health & Home
  'HeartPulse', 'Stethoscope', 'Heart', 'Dumbbell', 'ShieldCheck', 'Home', 'Wrench', 'Tag'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  transactions = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form input state
  const [catName, setCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS[0]);

  // Count transactions per category
  const txCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.category) {
        map.set(tx.category, (map.get(tx.category) || 0) + 1);
      }
    }
    return map;
  }, [transactions]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => {
    const matchesTab = c.type === activeTab;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const expenseCount = categories.filter((c) => c.type === 'expense').length;
  const incomeCount = categories.filter((c) => c.type === 'income').length;

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setSelectedColor(cat.color || CATEGORY_COLORS[0]);
    setSelectedIcon(cat.icon || CATEGORY_ICONS[0]);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCatName('');
    setSelectedColor(CATEGORY_COLORS[0]);
    setSelectedIcon(CATEGORY_ICONS[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = catName.trim();
    if (!cleanName) {
      showToast('Masukkan nama kategori', 'error');
      return;
    }

    if (editingCategory) {
      // Check duplicate name excluding itself
      const isDuplicate = categories.some(
        (c) => c.id !== editingCategory.id && c.type === activeTab && c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (isDuplicate) {
        showToast(`Kategori "${cleanName}" sudah ada!`, 'error');
        return;
      }

      if (onUpdateCategory) {
        onUpdateCategory(
          {
            ...editingCategory,
            name: cleanName,
            color: selectedColor,
            icon: selectedIcon,
          },
          editingCategory.name
        );
        showToast(`Kategori "${cleanName}" berhasil diperbarui!`, 'success');
      }
      handleCancelEdit();
    } else {
      // Check duplicate
      const isDuplicate = categories.some(
        (c) => c.type === activeTab && c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (isDuplicate) {
        showToast(`Kategori "${cleanName}" sudah ada!`, 'error');
        return;
      }

      onAddCategory({
        name: cleanName,
        type: activeTab,
        color: selectedColor,
        icon: selectedIcon,
      });

      showToast(`Kategori "${cleanName}" berhasil ditambahkan!`, 'success');
      setCatName('');
    }
  };

  const handleDelete = async (cat: Category) => {
    const usageCount = txCountMap.get(cat.name) || 0;
    const warningText = usageCount > 0
      ? `Perhatian: Ada ${usageCount} riwayat transaksi yang menggunakan kategori "${cat.name}". Kategori ini akan dihapus dari pilihan.`
      : `Kategori "${cat.name}" akan dihapus dari daftar pilihan.`;

    const confirmed = await showConfirmDialog(
      `Hapus Kategori "${cat.name}"?`,
      warningText,
      'Hapus Kategori',
      true
    );

    if (confirmed) {
      onDeleteCategory(cat.id);
      if (editingCategory?.id === cat.id) {
        handleCancelEdit();
      }
      showToast(`Kategori "${cat.name}" dihapus.`, 'info');
    }
  };

  const handleResetToDefaults = async () => {
    const confirmed = await showConfirmDialog(
      'Kembalikan Kategori Bawaan?',
      'Daftar kategori pengeluaran & pemasukan akan di-reset kembali ke paket standar CatatCuan.',
      'Ya, Pulihkan Default',
      false
    );

    if (confirmed) {
      if (onResetCategories) {
        onResetCategories();
      }
      showToast('Kategori bawaan berhasil dipulihkan!', 'success');
      handleCancelEdit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-950">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Kelola Kategori Transaksi</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Tambah, ubah nama/ikon/warna, atau hapus kategori kas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            data-sound="cancel"
            aria-label="Tutup dan Batalkan"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Pengeluaran vs Pemasukan */}
        <div className="px-6 pt-4 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('expense');
                handleCancelEdit();
              }}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pengeluaran ({expenseCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('income');
                handleCancelEdit();
              }}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pemasukan ({incomeCount})
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Form: Add or Edit Category */}
          <form
            onSubmit={handleSubmit}
            className={`p-4 rounded-2xl border transition-all ${
              editingCategory
                ? 'bg-indigo-950/30 border-indigo-500/40 ring-1 ring-indigo-500/30'
                : 'bg-slate-950/70 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                {editingCategory ? (
                  <>
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Kategori: <span className="text-indigo-300">{editingCategory.name}</span></span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tambah Kategori {activeTab === 'expense' ? 'Pengeluaran' : 'Pemasukan'} Baru</span>
                  </>
                )}
              </span>
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  Batal Edit
                </button>
              )}
            </div>

            {/* Input & Action Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder={`Contoh: ${activeTab === 'expense' ? 'Kopi & Nongkrong, Langganan Netflix' : 'Gaji Freelance, Dividen Saham'}`}
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-md shrink-0 ${
                  editingCategory
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                }`}
              >
                {editingCategory ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </>
                )}
              </button>
            </div>

            {/* Icon Picker */}
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Pilih Ikon Visual:</span>
                <span className="text-[10px] text-emerald-400 font-normal">Aktif: {selectedIcon}</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                {CATEGORY_ICONS.map((ic) => {
                  const isSelected = selectedIcon === ic;
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setSelectedIcon(ic)}
                      title={ic}
                      className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold scale-110 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <DynamicIcon name={ic} className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                <span>Pilih Aksen Warna:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {CATEGORY_COLORS.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      style={{ backgroundColor: col }}
                      className={`w-6 h-6 rounded-full transition-all ${
                        isSelected
                          ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </form>

          {/* List of Existing Categories */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="text-xs font-bold text-slate-300">
                Daftar Kategori ({filteredCategories.length})
              </div>
              
              {/* Quick Search */}
              <div className="relative w-40 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-white focus:border-slate-600 outline-none"
                />
              </div>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800">
                <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Tidak ada kategori yang cocok</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {filteredCategories.map((cat) => {
                  const usageCount = txCountMap.get(cat.name) || 0;
                  const isBeingEdited = editingCategory?.id === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isBeingEdited
                          ? 'bg-indigo-950/40 border-indigo-500/50'
                          : 'bg-slate-950/50 hover:bg-slate-800/40 border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <DynamicIcon name={cat.icon || 'Tag'} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-2">
                            <span>{cat.name}</span>
                            {usageCount > 0 && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                • {usageCount} transaksi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Edit & Delete) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                          title="Ubah Kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
          <button
            onClick={handleResetToDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Default</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
