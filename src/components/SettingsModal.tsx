import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  User,
  Coins,
  Sliders,
  Palette,
  HardDrive,
  Eye,
  EyeOff,
  BatteryCharging,
  FileSpreadsheet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Check,
  AlertCircle,
  Calendar,
  Layers,
  Tag,
  Lock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings, Wallet, Transaction, Category, Budget, SavingsGoal, DebtRecord } from '../types';
import { showToast, showConfirmDialog, showSuccessAlert, showErrorAlert } from '../utils/sweetalert';
import { DEFAULT_CATEGORIES, DEFAULT_TRANSACTIONS, DEFAULT_WALLETS, DEFAULT_SETTINGS, exportToCSV } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savings: SavingsGoal[];
  debts?: DebtRecord[];
  onResetData: (w: Wallet[], t: Transaction[], c: Category[]) => void;
  onRestoreDebts?: (debts: DebtRecord[]) => void;
  onLoadDemoData?: () => void;
  onOpenCategoryModal?: () => void;
}

type TabKey = 'profile' | 'currency' | 'budget' | 'display' | 'data';

const AVATAR_OPTIONS = ['👤', '😎', '🐱', '🦊', '🦁', '🐼', '🚀', '💎', '👑', '💰', '🎯', '⚡'];
const ACCENT_COLORS = [
  { id: 'emerald', label: 'Emerald Hijau', bg: 'bg-emerald-500', hex: '#10b981' },
  { id: 'blue', label: 'Royal Blue', bg: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'purple', label: 'Purple Violet', bg: 'bg-purple-500', hex: '#a855f7' },
  { id: 'amber', label: 'Sunset Amber', bg: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'rose', label: 'Modern Rose', bg: 'bg-rose-500', hex: '#f43f5e' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  wallets,
  transactions,
  categories,
  budgets,
  savings,
  debts = [],
  onResetData,
  onRestoreDebts,
  onLoadDemoData,
  onOpenCategoryModal,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
  };

  const handleExportJSON = () => {
    try {
      const dataToExport = {
        app: 'CatatCuan',
        version: 3,
        exportedAt: new Date().toISOString(),
        settings,
        wallets,
        transactions,
        categories,
        budgets,
        savings,
        debts,
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

      showToast('Cadangan data lengkap berhasil diunduh!', 'success');
    } catch {
      showToast('Gagal mengekspor data', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(transactions, wallets);
      showToast('Data berhasil diekspor ke format Excel (CSV)!', 'success');
    } catch {
      showToast('Gagal mengekspor data ke CSV', 'error');
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
          showErrorAlert('Format Tidak Sesuai', 'File JSON tidak memiliki struktur data CatatCuan yang valid.');
          return;
        }

        const confirmed = await showConfirmDialog(
          'Pulihkan Cadangan?',
          `Akan memulihkan ${parsed.wallets.length} dompet, ${parsed.transactions.length} transaksi${
            parsed.debts ? `, dan ${parsed.debts.length} catatan utang-piutang` : ''
          }. Data saat ini akan diperbarui.`,
          'Pulihkan Sekarang',
          true
        );

        if (confirmed) {
          if (parsed.settings) onUpdateSettings(parsed.settings);
          onResetData(parsed.wallets, parsed.transactions, parsed.categories || DEFAULT_CATEGORIES);
          if (parsed.debts && onRestoreDebts) {
            onRestoreDebts(parsed.debts);
          }
          showSuccessAlert('Data Berhasil Dipulihkan', 'Semua catatan keuangan Anda telah sinkron kembali.');
          onClose();
        }
      } catch {
        showErrorAlert('Gagal Membaca File', 'Pastikan file yang dipilih adalah format .json yang valid.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetToZero = async () => {
    const confirmed = await showConfirmDialog(
      'Kosongkan Semua Catatan?',
      'Semua riwayat transaksi akan dihapus bersih dan saldo dompet akan kembali ke Rp 0.',
      'Ya, Kosongkan',
      true
    );

    if (confirmed) {
      const zeroWallets = wallets.map((w) => ({ ...w, initialBalance: 0 }));
      onResetData(zeroWallets, [], categories);
      showSuccessAlert('Catatan Bersih!', 'Semua transaksi telah dihapus dan saldo kembali ke Rp 0.');
      onClose();
    }
  };

  const handleResetFactory = async () => {
    const confirmed = await showConfirmDialog(
      'Reset Pabrik (Setelan Awal)?',
      'Aplikasi akan dikembalikan seperti saat pertama kali dibuka.',
      'Ya, Reset Total',
      true
    );

    if (confirmed) {
      onUpdateSettings(DEFAULT_SETTINGS);
      onResetData(DEFAULT_WALLETS, DEFAULT_TRANSACTIONS, DEFAULT_CATEGORIES);
      showSuccessAlert('Reset Berhasil', 'CatatCuan telah dikembalikan ke setelan awal pabrik.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-950">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Pengaturan CatatCuan</h2>
              <p className="text-[11px] text-slate-400">Kustomisasi profil, mata uang, tampilan & data</p>
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

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-800 overflow-x-auto bg-slate-950/40 shrink-0 scrollbar-none">
          {[
            { key: 'profile', label: 'Profil', icon: User },
            { key: 'currency', label: 'Mata Uang', icon: Coins },
            { key: 'budget', label: 'Anggaran & Siklus', icon: Sliders },
            { key: 'display', label: 'Tampilan', icon: Palette },
            { key: 'data', label: 'Cadangan & Data', icon: HardDrive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 pr-3">
          {/* TAB 1: PROFIL & IDENTITAS */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner">
                    {settings.userAvatar || '👤'}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Pemilik / Buku Kas
                    </label>
                    <input
                      type="text"
                      value={settings.userName}
                      onChange={(e) => updateSetting('userName', e.target.value)}
                      placeholder="Contoh: Galdi"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Avatar Chooser */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Pilih Avatar Profil
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => {
                          updateSetting('userAvatar', av);
                          showToast(`Avatar diubah ke ${av}`, 'success');
                        }}
                        className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                          settings.userAvatar === av
                            ? 'bg-emerald-600/30 border-2 border-emerald-400 scale-105'
                            : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio / Financial Motto */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Motto / Sasaran Keuangan Anda
                  </label>
                  <input
                    type="text"
                    value={settings.userBio}
                    onChange={(e) => updateSetting('userBio', e.target.value)}
                    placeholder="Contoh: Hemat di awal, tenang di hari tua ✨"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATA UANG & FORMAT ANGKA */}
          {activeTab === 'currency' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                {/* Currency Symbol */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Simbol Mata Uang
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { sym: 'Rp', name: 'Rupiah (IDR)' },
                      { sym: '$', name: 'Dollar (USD)' },
                      { sym: 'RM', name: 'Ringgit (MYR)' },
                      { sym: '€', name: 'Euro (EUR)' },
                      { sym: '¥', name: 'Yen (JPY)' },
                      { sym: 'SAR', name: 'Riyal (SAR)' },
                    ].map((cur) => (
                      <button
                        key={cur.sym}
                        type="button"
                        onClick={() => updateSetting('currencySymbol', cur.sym)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          settings.currencySymbol === cur.sym
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-base font-bold">{cur.sym}</div>
                        <div className="text-[10px] truncate">{cur.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Posisi Simbol Mata Uang
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('currencyPosition', 'prefix')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        settings.currencyPosition === 'prefix'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">Di Depan (Awalan)</div>
                      <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                        {settings.currencySymbol} 50.000
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('currencyPosition', 'suffix')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        settings.currencyPosition === 'suffix'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">Di Belakang (Akhiran)</div>
                      <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                        50.000 {settings.currencySymbol}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Thousand Separator */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Format Pemisah Ribuan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('thousandSeparator', '.')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.thousandSeparator === '.'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">Titik Standar Indonesia</div>
                      <div className="text-[11px] text-slate-400">Contoh: 1.000.000</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('thousandSeparator', ',')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.thousandSeparator === ','
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold">Koma Standar Internasional</div>
                      <div className="text-[11px] text-slate-400">Contoh: 1,000,000</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANGGARAN & SIKLUS GAJIAN */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                {/* Salary Cycle Date */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tanggal Awal Siklus Gajian</span>
                    </label>
                    <span className="text-xs font-bold text-emerald-400">
                      Setiap tanggal {settings.salaryCycleDate || 1}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={28}
                    value={settings.salaryCycleDate || 1}
                    onChange={(e) => updateSetting('salaryCycleDate', parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    CatatCuan akan mereset hitungan pengeluaran bulanan sesuai siklus gajian Anda (misal tanggal 25).
                  </p>
                </div>

                {/* Budget Warning Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Peringatan Ambang Batas Anggaran</span>
                    </label>
                    <span className="text-xs font-bold text-amber-400">
                      {settings.budgetWarningThreshold || 80}% Terpakai
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[70, 80, 90].map((thr) => (
                      <button
                        key={thr}
                        type="button"
                        onClick={() => updateSetting('budgetWarningThreshold', thr)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          settings.budgetWarningThreshold === thr
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {thr}% Terpakai
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Admin Fee */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Biaya Admin Transfer Standar
                    </label>
                    <span className="text-xs font-bold text-cyan-400">
                      Rp {settings.defaultAdminFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Gratis (Rp 0)', val: 0 },
                      { label: 'Rp 2.500 (BI-Fast)', val: 2500 },
                      { label: 'Rp 6.500 (Online)', val: 6500 },
                    ].map((fee) => (
                      <button
                        key={fee.val}
                        type="button"
                        onClick={() => updateSetting('defaultAdminFee', fee.val)}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-all ${
                          settings.defaultAdminFee === fee.val
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {fee.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start of Week */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Hari Awal Pekan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('startOfWeek', 'monday')}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        settings.startOfWeek === 'monday'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Senin (Bawaan)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSetting('startOfWeek', 'sunday')}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        settings.startOfWeek === 'sunday'
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Minggu
                    </button>
                  </div>
                </div>

                {/* Manage Categories Tile */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kelola Kategori Kas & Transaksi</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {categories.length} kategori aktif ({categories.filter((c) => c.type === 'expense').length} pengeluaran, {categories.filter((c) => c.type === 'income').length} pemasukan)
                    </div>
                  </div>
                  {onOpenCategoryModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCategoryModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all shrink-0"
                    >
                      Buka Kelola Kategori
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TAMPILAN & PERFORMA HP KENTANG */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                {/* Privacy Mode Toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-slate-300">
                      {settings.privacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Mode Sensor Privasi Saldo</div>
                      <div className="text-[11px] text-slate-400">
                        Samarkan saldo dengan titik (Rp ••••••) untuk keamanan di publik
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('privacyMode', !settings.privacyMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.privacyMode ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        settings.privacyMode ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* PIN Lock Security Toggle */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Kunci Keamanan PIN</span>
                          {settings.pinLockEnabled && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Meminta 4 digit PIN setiap kali aplikasi web dibuka
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!settings.pinLockEnabled && !settings.pinCode) {
                          // Prompt user to set a pin code
                          updateSetting('pinCode', '1234');
                        }
                        updateSetting('pinLockEnabled', !settings.pinLockEnabled);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        settings.pinLockEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                          settings.pinLockEnabled ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.pinLockEnabled && (
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-slate-300 font-semibold">Kode PIN Saat Ini:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="Contoh: 1234"
                          value={settings.pinCode || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            updateSetting('pinCode', val);
                          }}
                          className="w-24 px-2.5 py-1 text-center font-mono text-xs font-bold text-white bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500">4-6 digit</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Low Power Mode Toggle (HP Kentang) */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400">
                      <BatteryCharging className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Mode Hemat Daya / HP Kentang</div>
                      <div className="text-[11px] text-slate-400">
                        Matikan efek glow & animasi berat agar navigasi 60fps lancar
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('lowPowerMode', !settings.lowPowerMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.lowPowerMode ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        settings.lowPowerMode ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Compact Mode */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-cyan-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Mode Tampilan Rapat (Compact)</div>
                      <div className="text-[11px] text-slate-400">
                        Memaksimalkan ruang layar dengan padding yang lebih hemat
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('compactMode', !settings.compactMode)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.compactMode ? 'bg-cyan-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        settings.compactMode ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound FX Toggle */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-purple-400">
                      {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Efek Suara Sukses</div>
                      <div className="text-[11px] text-slate-400">
                        Notifikasi audio halus saat transaksi berhasil dicatat
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      settings.soundEnabled ? 'bg-purple-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                        settings.soundEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Accent Color Palette */}
                <div className="pt-3 border-t border-slate-800/80">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Aksen Warna Tema
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {ACCENT_COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => updateSetting('accentColor', col.id as any)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          settings.accentColor === col.id
                            ? 'bg-slate-800 border-white text-white ring-1 ring-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full ${col.bg}`} />
                        <span>{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CADANGAN & MANAJEMEN DATA */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Ekspor & Impor Data
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all flex items-start gap-3 shadow-sm active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Ekspor ke Excel (CSV)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Format tabel siap olah di Microsoft Excel atau Google Sheets
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/40 text-left transition-all flex items-start gap-3 shadow-sm active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                      <ArrowDownToLine className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Cadangan Penuh (JSON)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Simpan seluruh dompet, transaksi, target anggaran & celengan
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleImportClick}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left transition-all flex items-start gap-3 shadow-sm active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                      <ArrowUpFromLine className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Pulihkan Cadangan (JSON)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Unggah file cadangan untuk memulihkan seluruh pembukuan
                      </div>
                    </div>
                  </button>

                  {onLoadDemoData && (
                    <button
                      type="button"
                      onClick={onLoadDemoData}
                      className="p-3.5 rounded-2xl bg-slate-900 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/40 text-left transition-all flex items-start gap-3 shadow-sm active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-indigo-300">Muat Data Simulasi Cuan</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Isi contoh transaksi untuk mencoba seluruh grafik & fitur
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Zona Bahaya & Reset
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleResetToZero}
                      className="p-3 rounded-2xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-left transition-all flex items-center gap-2.5 active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-rose-300">Kosongkan Riwayat ke Rp 0</div>
                        <div className="text-[10px] text-slate-400">Hapus transaksi tanpa hapus dompet</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetFactory}
                      className="p-3 rounded-2xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-left transition-all flex items-center gap-2.5 active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-rose-400">Reset Total Pabrik</div>
                        <div className="text-[10px] text-slate-400">Kembalikan ke awal pertama kali dibuka</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>CatatCuan v3.0 • 100% Offline-First</span>
          <span className="text-emerald-400 font-semibold">Tersimpan Otomatis di Browser</span>
        </div>
      </div>
    </div>
  );
};
