import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Clipboard,
  CheckCircle2,
  HelpCircle,
  Coins,
  Wallet as WalletIcon,
} from 'lucide-react';
import { Wallet, Category, Transaction, ParsedNotification } from '../types';
import { parseNotificationText, SAMPLE_NOTIFICATIONS } from '../utils/notificationParser';
import { formatRupiah, getTodayDateString } from '../utils/formatters';
import { showToast, showSuccessAlert, showErrorAlert } from '../utils/sweetalert';

interface AutoDetectModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  onSaveTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const AutoDetectModal: React.FC<AutoDetectModalProps> = ({
  isOpen,
  onClose,
  wallets,
  categories,
  onSaveTransaction,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParsedNotification | null>(null);

  // Editable overrides if user wants to tweak parsed result
  const [overrideWalletId, setOverrideWalletId] = useState('');
  const [overrideToWalletId, setOverrideToWalletId] = useState('');
  const [overrideCategory, setOverrideCategory] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Clear or preset
      setInputText('');
      setParsed(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (inputText.trim()) {
      const result = parseNotificationText(inputText, wallets, categories);
      setParsed(result);
      if (result) {
        setOverrideWalletId(result.suggestedWalletId || wallets[0]?.id || '');
        setOverrideToWalletId(result.suggestedToWalletId || wallets.find((w) => w.id !== result.suggestedWalletId)?.id || '');
        setOverrideCategory(result.suggestedCategory);
      }
    } else {
      setParsed(null);
    }
  }, [inputText, wallets, categories]);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setInputText(clipText);
          showToast('Teks berhasil ditempel dari clipboard!', 'info');
          return;
        }
      }
      showToast('Tempel manual ke dalam kotak teks', 'info');
    } catch {
      showToast('Silakan tempel teks secara manual', 'info');
    }
  };

  const handleApplySample = (sampleText: string) => {
    setInputText(sampleText);
  };

  const handleSave = () => {
    if (!parsed || parsed.amount <= 0) {
      showErrorAlert('Nominal Belum Terdeteksi', 'Pastikan teks notifikasi memuat nominal uang yang jelas.');
      return;
    }

    onSaveTransaction({
      type: parsed.type,
      amount: parsed.amount,
      adminFee: parsed.type === 'transfer' ? (parsed.adminFee || 0) : undefined,
      category: parsed.type === 'transfer' ? 'Transfer Antar Dompet' : (overrideCategory || parsed.suggestedCategory),
      walletId: overrideWalletId || parsed.suggestedWalletId || wallets[0].id,
      toWalletId: parsed.type === 'transfer' ? (overrideToWalletId || parsed.suggestedToWalletId) : undefined,
      date: parsed.date || getTodayDateString(),
      note: parsed.note,
    });

    showSuccessAlert(
      'Transaksi Otomatis Disimpan!',
      `${parsed.type === 'transfer' ? 'Transfer' : parsed.suggestedCategory} sebesar ${formatRupiah(parsed.amount)} berhasil masuk ke pembukuan.`
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Deteksi Otomatis Notifikasi
              </h2>
              <p className="text-[11px] text-slate-400">
                Deteksi mutasi transfer bank, SMS banking, QRIS, & e-wallet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Paste & Text Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Salin & Tempel Notifikasi / SMS Mutasi Di Sini:</span>
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
              >
                <Clipboard className="w-3 h-3" />
                <span>Tempel dari Clipboard</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Contoh: Transfer berhasil ke rekening BCA 1234567890 Rp 150.000 Biaya Admin Rp 2.500"
              className="w-full p-3 bg-slate-950 border border-slate-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-600 outline-none transition-all resize-none"
            />
          </div>

          {/* Sample Notification Presets */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <span>Coba contoh mutasi (klik untuk coba):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_NOTIFICATIONS.map((sample) => (
                <button
                  key={sample.title}
                  type="button"
                  onClick={() => handleApplySample(sample.text)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-left"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          {/* Live Parsing Result Box */}
          {parsed && parsed.amount > 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Data Berhasil Terdeteksi!</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {parsed.type === 'transfer' ? 'Transfer' : parsed.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
              </div>

              {/* Amount & Admin Fee Display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Nominal Transaksi</span>
                  <span className="text-lg font-bold text-white">{formatRupiah(parsed.amount)}</span>
                </div>

                {parsed.type === 'transfer' && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 mb-0.5">
                      <Coins className="w-3 h-3" />
                      <span>Biaya Admin</span>
                    </span>
                    <span className="text-lg font-bold text-amber-400">
                      {formatRupiah(parsed.adminFee || 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Wallet Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {parsed.type === 'transfer' ? 'Dompet Asal' : parsed.type === 'income' ? 'Masuk ke Dompet' : 'Sumber Pembayaran'}
                  </label>
                  <select
                    value={overrideWalletId}
                    onChange={(e) => setOverrideWalletId(e.target.value)}
                    className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.currentBalance ?? w.initialBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                {parsed.type === 'transfer' ? (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Dompet Tujuan
                    </label>
                    <select
                      value={overrideToWalletId}
                      onChange={(e) => setOverrideToWalletId(e.target.value)}
                      className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    >
                      {wallets
                        .filter((w) => w.id !== overrideWalletId)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Kategori Transaksi
                    </label>
                    <select
                      value={overrideCategory}
                      onChange={(e) => setOverrideCategory(e.target.value)}
                      className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                    >
                      {categories
                        .filter((c) => c.type === parsed.type)
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Note summary */}
              <div className="text-[11px] text-slate-400 pt-1">
                <span className="font-semibold text-slate-300">Catatan: </span>
                <span>{parsed.note}</span>
              </div>
            </div>
          ) : inputText.trim().length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center">
              Sedang membaca teks notifikasi... Pastikan tertera nominal uang seperti "Rp 50.000".
            </div>
          ) : null}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={!parsed || parsed.amount <= 0}
              onClick={handleSave}
              className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Simpan Otomatis ke CatatCuan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
