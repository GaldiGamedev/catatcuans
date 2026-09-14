import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Wallet, WalletType } from '../types';
import { DynamicIcon, ICON_MAP } from './DynamicIcon';
import { parseNumberInput } from '../utils/formatters';
import { showToast, showErrorAlert } from '../utils/sweetalert';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWallet: (walletData: Omit<Wallet, 'id'>, idToEdit?: string) => void;
  walletToEdit?: Wallet | null;
}

const AVAILABLE_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#eab308', // yellow
  '#64748b', // slate
];

const AVAILABLE_ICONS = [
  'Wallet',
  'Building2',
  'Smartphone',
  'PiggyBank',
  'CreditCard',
  'Coins',
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSaveWallet,
  walletToEdit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);

  useEffect(() => {
    if (isOpen) {
      if (walletToEdit) {
        setName(walletToEdit.name);
        setType(walletToEdit.type);
        setInitialBalanceInput(String(walletToEdit.initialBalance || 0));
        setColor(walletToEdit.color || AVAILABLE_COLORS[0]);
        setIcon(walletToEdit.icon || AVAILABLE_ICONS[0]);
      } else {
        setName('');
        setType('bank');
        setInitialBalanceInput('');
        setColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
        setIcon('Wallet');
      }
    }
  }, [isOpen, walletToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showErrorAlert('Nama Dompet Kosong', 'Harap isi nama dompet atau rekening.');
      return;
    }

    const initialBalance = parseNumberInput(initialBalanceInput);

    onSaveWallet(
      {
        name: name.trim(),
        type,
        color,
        icon,
        initialBalance,
      },
      walletToEdit ? walletToEdit.id : undefined
    );

    showToast(
      walletToEdit
        ? `Dompet ${name} berhasil diperbarui!`
        : `Dompet ${name} berhasil ditambahkan!`,
      'success'
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-white">
            {walletToEdit ? 'Ubah Dompet / Rekening' : 'Tambah Dompet Baru'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Wallet Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Dompet / Rekening <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Dompet Tunai, BCA, GoPay, Seabank..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-2xl text-sm text-white outline-none"
            />
          </div>

          {/* Wallet Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jenis Dompet
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Tunai' },
                { id: 'bank', label: 'Bank' },
                { id: 'ewallet', label: 'E-Wallet' },
                { id: 'savings', label: 'Tabungan' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as WalletType)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center ${
                    type === t.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Saldo Awal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={initialBalanceInput ? Number(initialBalanceInput).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setInitialBalanceInput(val);
                }}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-2xl text-sm font-semibold text-white outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Saldo saat mulai mencatat di aplikasi ini.
            </p>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Ikon Dompet
            </label>
            <div className="flex items-center gap-2">
              {AVAILABLE_ICONS.map((icName) => {
                const isSelected = icon === icName;
                return (
                  <button
                    key={icName}
                    type="button"
                    onClick={() => setIcon(icName)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <DynamicIcon name={icName} className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Warna Kartu
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
            >
              {walletToEdit ? 'Simpan Perubahan' : 'Buat Dompet Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
