import React from 'react';
import { Plus, MoreVertical, ArrowRightLeft, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { Wallet } from '../types';
import { formatRupiah } from '../utils/formatters';
import { DynamicIcon } from './DynamicIcon';
import { showConfirmDialog, showToast } from '../utils/sweetalert';

interface WalletsSectionProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelectWallet: (walletId: string | null) => void;
  onOpenWalletModal: (walletToEdit?: Wallet) => void;
  onOpenTransferModalWithSource?: (walletId: string) => void;
  onDeleteWallet: (walletId: string) => void;
  privacyMode?: boolean;
}

export const WalletsSection: React.FC<WalletsSectionProps> = ({
  wallets,
  selectedWalletId,
  onSelectWallet,
  onOpenWalletModal,
  onOpenTransferModalWithSource,
  onDeleteWallet,
  privacyMode = false,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  const getTypeName = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Bank';
      case 'ewallet':
        return 'E-Wallet';
      case 'savings':
        return 'Tabungan';
      default:
        return 'Tunai';
    }
  };

  const handleDelete = async (wallet: Wallet, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);

    if (wallets.length <= 1) {
      showToast('Minimal harus ada 1 dompet aktif!', 'warning');
      return;
    }

    const confirmed = await showConfirmDialog(
      `Hapus Dompet "${wallet.name}"?`,
      `Dompet ini akan dihapus. Riwayat transaksi dompet ini tetap tersimpan.`,
      'Ya, Hapus Dompet',
      true
    );

    if (confirmed) {
      onDeleteWallet(wallet.id);
      showToast(`Dompet ${wallet.name} berhasil dihapus.`, 'info');
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Daftar Dompet & Rekening</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60">
              {wallets.length}
            </span>
          </h2>
          {selectedWalletId && (
            <button
              onClick={() => onSelectWallet(null)}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-2 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
        <button
          onClick={() => onOpenWalletModal()}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Dompet</span>
        </button>
      </div>

      {/* Horizontal Scroll on Mobile / Multi-column Grid on Desktop */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
        {wallets.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          const balance = wallet.currentBalance ?? wallet.initialBalance;
          const isNegative = balance < 0;

          return (
            <div
              key={wallet.id}
              onClick={() => onSelectWallet(isSelected ? null : wallet.id)}
              className={`min-w-[240px] sm:min-w-0 snap-center relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? 'border-emerald-500/80 bg-slate-900/95 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40 scale-[1.01]'
                  : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Icon, Name, Options */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: wallet.color }}
                  >
                    <DynamicIcon name={wallet.icon || 'Wallet'} className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white truncate max-w-[130px]" title={wallet.name}>
                      {wallet.name}
                    </h3>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
                      {getTypeName(wallet.type)}
                    </span>
                  </div>
                </div>

                {/* Dropdown menu trigger */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === wallet.id ? null : wallet.id);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuId === wallet.id && (
                    <div
                      className="absolute right-0 top-7 w-36 rounded-xl bg-slate-850 border border-slate-700 shadow-2xl p-1 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onOpenTransferModalWithSource && (
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onOpenTransferModalWithSource(wallet.id);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-750 rounded-lg flex items-center gap-2"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                          <span>Transfer Keluar</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveMenuId(null);
                          onOpenWalletModal(wallet);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-750 rounded-lg flex items-center gap-2"
                      >
                        <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Ubah Dompet</span>
                      </button>
                      <button
                        onClick={(e) => handleDelete(wallet, e)}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Row */}
              <div className="mt-2">
                <div className="text-xs text-slate-400 mb-0.5">Saldo Dompet</div>
                <div
                  className={`text-lg font-bold tracking-tight ${
                    isNegative ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {privacyMode ? 'Rp ••••••' : formatRupiah(balance)}
                </div>
              </div>

              {/* Selected state pill badge */}
              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Menyaring riwayat
                  </span>
                  <span className="text-[10px] text-slate-400 hover:underline">Klik unfilter</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Quick Add Wallet Card */}
        <button
          onClick={() => onOpenWalletModal()}
          className="min-w-[140px] sm:min-w-0 snap-center rounded-2xl p-4 border border-dashed border-slate-700/80 hover:border-emerald-500/60 bg-slate-900/20 hover:bg-slate-900/40 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 transition-all group active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-emerald-500/10 border border-slate-700 group-hover:border-emerald-500/30 flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
          </div>
          <span className="text-xs font-semibold">Tambah Baru</span>
        </button>
      </div>
    </section>
  );
};
