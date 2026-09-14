import React, { useRef } from 'react';
import {
  WalletCards,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Sparkles,
  Settings,
  Tag,
  Home,
  Target,
  PieChart,
} from 'lucide-react';
import { showConfirmDialog, showToast, showSuccessAlert, showErrorAlert } from '../utils/sweetalert';
import { Transaction, Wallet, Category, AppSettings } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_TRANSACTIONS, DEFAULT_WALLETS } from '../utils/storage';

interface HeaderProps {
  onOpenTransactionModal: () => void;
  onOpenWalletModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenSettings: () => void;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  settings?: AppSettings;
  onResetData: (w: Wallet[], t: Transaction[], c: Category[]) => void;
  currentTab?: 'home' | 'budget' | 'analytics';
  onChangeTab?: (tab: 'home' | 'budget' | 'analytics') => void;
  budgetsCount?: number;
  savingsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTransactionModal,
  onOpenWalletModal,
  onOpenCategoryModal,
  onOpenSettings,
  wallets,
  transactions,
  categories,
  settings,
  onResetData,
  currentTab = 'home',
  onChangeTab,
  budgetsCount = 0,
  savingsCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    try {
      const dataToExport = {
        app: 'CatatCuan',
        version: 3,
        exportedAt: new Date().toISOString(),
        settings,
        wallets,
        transactions,
        categories,
      };

      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `catatcuan-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Cadangan data berhasil diunduh!', 'success');
    } catch {
      showErrorAlert('Gagal Ekspor', 'Terjadi kesalahan saat mengekspor data.');
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.wallets || !parsed.transactions) {
          showErrorAlert('Format Salah', 'File JSON tidak memiliki struktur data CatatCuan yang valid.');
          return;
        }

        const confirmed = await showConfirmDialog(
          'Pulihkan Data Cadangan?',
          `Akan memulihkan ${parsed.wallets.length} dompet dan ${parsed.transactions.length} riwayat transaksi. Data saat ini akan ditimpa.`,
          'Pulihkan Sekarang',
          true
        );

        if (confirmed) {
          onResetData(
            parsed.wallets,
            parsed.transactions,
            parsed.categories || DEFAULT_CATEGORIES
          );
          showSuccessAlert('Data Berhasil Dipulihkan', 'Semua dompet dan riwayat transaksi telah diperbarui.');
        }
      } catch {
        showErrorAlert('Gagal Membaca File', 'Pastikan file yang diunggah berformat .json yang valid.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    const confirmed = await showConfirmDialog(
      'Reset Data ke Bawaan?',
      'Semua transaksi dan dompet buatan Anda akan dikembalikan ke data awal.',
      'Ya, Reset Data',
      true
    );

    if (confirmed) {
      onResetData(DEFAULT_WALLETS, DEFAULT_TRANSACTIONS, DEFAULT_CATEGORIES);
      showToast('Data berhasil di-reset ke setelan awal!', 'info');
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-lg">
              {settings?.userAvatar || <WalletCards className="w-5 h-5 text-emerald-400" />}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1">
                <span>Catat</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                  Cuan
                </span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" /> {settings?.userName ? `Halo, ${settings.userName}` : 'Smart Cashflow'}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
              {settings?.userBio || 'Kelola Dompet, Anggaran & Catatan Keuangan Pintar'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        {onChangeTab && (
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-800/90 shadow-inner">
            <button
              type="button"
              onClick={() => onChangeTab('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'home'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Ringkasan</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('budget')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'budget'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Target & Celengan</span>
              {(budgetsCount > 0 || savingsCount > 0) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-500/20">
                  {budgetsCount + savingsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'analytics'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Analitik</span>
            </button>
          </nav>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for JSON import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Backup / Restore Menu */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={handleExportData}
              title="Cadangkan Data (JSON)"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium"
            >
              <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Ekspor</span>
            </button>
            <button
              onClick={handleImportClick}
              title="Pulihkan Data Cadangan"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-medium"
            >
              <ArrowUpFromLine className="w-4 h-4 text-cyan-400" />
              <span className="hidden lg:inline">Impor</span>
            </button>
            <button
              onClick={handleResetData}
              title="Reset ke Data Bawaan"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors text-xs flex items-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Manage Categories Button */}
          <button
            onClick={onOpenCategoryModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all shadow-sm active:scale-95"
            title="Kelola Kategori Transaksi"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Kategori</span>
          </button>

          {/* Add Wallet Button */}
          <button
            onClick={onOpenWalletModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Dompet Baru</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all active:scale-95"
            title="Pengaturan Aplikasi"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Primary Transaction CTA */}
          <button
            onClick={onOpenTransactionModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
