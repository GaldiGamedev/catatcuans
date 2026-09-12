import React from 'react';
import {
  X,
  Settings,
  Shield,
  Eye,
  EyeOff,
  BatteryCharging,
  Zap,
  Coins,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Info,
  Check,
  Smartphone,
} from 'lucide-react';
import { AppSettings, Wallet, Transaction, Category } from '../types';
import { showToast, showConfirmDialog, showSuccessAlert } from '../utils/sweetalert';
import { DEFAULT_CATEGORIES, DEFAULT_TRANSACTIONS, DEFAULT_WALLETS } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  onResetData: (w: Wallet[], t: Transaction[], c: Category[]) => void;
  onOpenAutoDetect: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  wallets,
  transactions,
  categories,
  onResetData,
  onOpenAutoDetect,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTogglePrivacy = () => {
    const updated = { ...settings, privacyMode: !settings.privacyMode };
    onUpdateSettings(updated);
    showToast(
      updated.privacyMode ? 'Mode privasi aktif: Saldo disensor' : 'Mode privasi nonaktif: Saldo ditampilkan',
      'info'
    );
  };

  const handleToggleLowPower = () => {
    const updated = { ...settings, lowPowerMode: !settings.lowPowerMode };
    onUpdateSettings(updated);
    showToast(
      updated.lowPowerMode ? 'Mode HP Kentang aktif: Performa dipercepat' : 'Mode normal aktif',
      'info'
    );
  };

  const handleDefaultAdminFee = (fee: number) => {
    onUpdateSettings({ ...settings, defaultAdminFee: fee });
    showToast(`Biaya admin bawaan diatur ke Rp ${fee.toLocaleString('id-ID')}`, 'success');
  };

  const handleExport = () => {
    try {
      const dataToExport = {
        app: 'CatatCuan',
        version: 2,
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
      showToast('Gagal mengekspor data', 'error');
    }
  };

  const handleResetToZero = async () => {
    const confirmed = await showConfirmDialog(
      'Reset Semua Data Ke Nol?',
      'Semua riwayat transaksi akan dihapus bersih dan saldo dompet akan kembali ke Rp 0.',
      'Ya, Kosongkan Data',
      true
    );

    if (confirmed) {
      const zeroWallets = DEFAULT_WALLETS.map((w) => ({ ...w, initialBalance: 0 }));
      onResetData(zeroWallets, [], DEFAULT_CATEGORIES);
      showSuccessAlert('Data Berhasil Dikosongkan', 'Pembukuan Anda kembali bersih dimulai dari Rp 0.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Pengaturan Aplikasi</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {/* Section 1: Fitur Pintar & Deteksi Otomatis */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Fitur Pintar & Transfer</span>
            </h3>

            {/* Auto Detect Notification Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-200">Deteksi Notifikasi Mutasi</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Ekstrak SMS banking, notifikasi transfer & QRIS jadi transaksi otomatis
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAutoDetect();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shrink-0 shadow-md shadow-emerald-950"
              >
                Buka
              </button>
            </div>

            {/* Default Admin Fee for Transfer */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Biaya Admin Transfer Bawaan</span>
                </span>
                <span className="text-xs font-bold text-amber-400">
                  Rp {settings.defaultAdminFee.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Gratis (Rp 0)', val: 0 },
                  { label: 'Rp 2.500 (BI-Fast)', val: 2500 },
                  { label: 'Rp 6.500 (Online)', val: 6500 },
                ].map((feeItem) => (
                  <button
                    key={feeItem.val}
                    type="button"
                    onClick={() => handleDefaultAdminFee(feeItem.val)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      settings.defaultAdminFee === feeItem.val
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {feeItem.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Tampilan & Optimalisasi HP Kentang */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Tampilan & Kenyamanan</span>
            </h3>

            {/* Privacy Mode Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-slate-300">
                  {settings.privacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Mode Sensor Privasi Saldo</div>
                  <div className="text-[11px] text-slate-400">
                    Samarkan angka saldo dengan titik-titik (Rp ••••••)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePrivacy}
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

            {/* Low Power Mode Toggle (HP Kentang Friendly) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400">
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Mode Hemat Daya / HP Kentang</div>
                  <div className="text-[11px] text-slate-400">
                    Matikan efek glow & blur agar navigasi ekstra cepat
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleLowPower}
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
          </div>

          {/* Section 3: Manajemen Data & Cadangan */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Manajemen Data & Penyimpanan</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-850 border border-slate-800 text-left transition-colors flex items-center gap-2.5"
              >
                <ArrowDownToLine className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Ekspor JSON</div>
                  <div className="text-[10px] text-slate-400">Unduh cadangan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleResetToZero}
                className="p-3 rounded-2xl bg-slate-950/70 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-left transition-colors flex items-center gap-2.5"
              >
                <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-300">Kosongkan Data</div>
                  <div className="text-[10px] text-slate-400">Kembalikan ke Rp 0</div>
                </div>
              </button>
            </div>
          </div>

          {/* About Applet */}
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-semibold">
              <span>CatatCuan v2.1</span>
              <span>100% Offline-First</span>
            </div>
            <p>Data Anda hanya tersimpan di browser Anda (LocalStorage), aman dan tanpa pengumpulan data pihak ketiga.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
