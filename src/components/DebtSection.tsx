import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  MessageCircle,
  X,
  CreditCard,
  User,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { DebtRecord, DebtType, Wallet } from '../types';
import { formatRupiah, parseNumberInput, formatDate, getTodayDateString } from '../utils/formatters';
import { showToast, showConfirmDialog, showSuccessAlert } from '../utils/sweetalert';
import { soundFx } from '../utils/audio';

interface DebtSectionProps {
  debts: DebtRecord[];
  wallets: Wallet[];
  onSaveDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (debtId: string) => void;
  onPayDebt: (debtId: string, amount: number, walletId: string, note?: string) => void;
}

export const DebtSection: React.FC<DebtSectionProps> = ({
  debts,
  wallets,
  onSaveDebt,
  onDeleteDebt,
  onPayDebt,
}) => {
  const [filterType, setFilterType] = useState<'all' | DebtType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Modal Add / Edit State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [debtType, setDebtType] = useState<DebtType>('receivable'); // default piutang (orang pinjam ke kita)
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');

  // Modal Payment (Cicilan / Pelunasan)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payWalletId, setPayWalletId] = useState(wallets[0]?.id || '');
  const [payNote, setPayNote] = useState('');

  // Aggregations
  const summary = useMemo(() => {
    let totalReceivable = 0; // Piutang yang belum kita terima
    let totalDebt = 0; // Utang kita yang belum lunas
    let overdueCount = 0;

    const todayStr = getTodayDateString();

    for (const d of debts) {
      const remaining = Math.max(0, d.totalAmount - d.paidAmount);
      if (remaining > 0) {
        if (d.type === 'receivable') {
          totalReceivable += remaining;
        } else {
          totalDebt += remaining;
        }

        if (d.dueDate && d.dueDate < todayStr) {
          overdueCount++;
        }
      }
    }

    return { totalReceivable, totalDebt, overdueCount };
  }, [debts]);

  // Filtered List
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (filterType !== 'all' && d.type !== filterType) return false;
      if (filterStatus === 'unpaid' && d.status === 'paid') return false;
      if (filterStatus === 'paid' && d.status !== 'paid') return false;
      return true;
    });
  }, [debts, filterType, filterStatus]);

  const handleOpenAdd = (type: DebtType = 'receivable') => {
    setDebtType(type);
    setPersonName('');
    setPhone('');
    setAmountInput('');
    // default due date: 30 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDueDate(d.toISOString().split('T')[0]);
    setSelectedWalletId(wallets[0]?.id || '');
    setNote('');
    setIsAddModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNumberInput(amountInput);

    if (!personName.trim()) {
      showToast('Nama orang atau pihak terkait wajib diisi', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('Nominal pinjaman/piutang harus lebih dari 0', 'error');
      return;
    }

    const newRecord: DebtRecord = {
      id: 'debt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type: debtType,
      personName: personName.trim(),
      phone: phone.trim() || undefined,
      totalAmount: amount,
      paidAmount: 0,
      dueDate: dueDate || getTodayDateString(),
      status: 'unpaid',
      walletId: selectedWalletId || undefined,
      note: note.trim() || undefined,
      createdAt: Date.now(),
      payments: [],
    };

    onSaveDebt(newRecord);
    setIsAddModalOpen(false);
    showToast(
      debtType === 'receivable'
        ? `Piutang kepada ${newRecord.personName} berhasil dicatat!`
        : `Utang kepada ${newRecord.personName} berhasil dicatat!`,
      'success'
    );
  };

  const handleOpenPay = (debt: DebtRecord) => {
    setSelectedDebt(debt);
    const remaining = debt.totalAmount - debt.paidAmount;
    setPayAmountInput(remaining > 0 ? remaining.toLocaleString('id-ID') : '');
    setPayWalletId(wallets[0]?.id || '');
    setPayNote('');
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    const amount = parseNumberInput(payAmountInput);
    const remaining = selectedDebt.totalAmount - selectedDebt.paidAmount;

    if (amount <= 0) {
      showToast('Nominal cicilan/pelunasan harus valid', 'error');
      return;
    }
    if (amount > remaining) {
      showToast('Nominal pembayaran melebihi sisa tagihan', 'error');
      return;
    }

    onPayDebt(selectedDebt.id, amount, payWalletId, payNote);
    setIsPayModalOpen(false);

    if (amount === remaining) {
      showSuccessAlert(
        'Lunas Sepenuhnya! 🎉',
        `Catatan ${selectedDebt.type === 'receivable' ? 'piutang dari' : 'utang kepada'} ${selectedDebt.personName} telah lunas 100%.`
      );
    } else {
      showToast(`Pembayaran ${formatRupiah(amount)} berhasil dicatat`, 'success');
    }
  };

  const handleDelete = async (debt: DebtRecord) => {
    const ok = await showConfirmDialog(
      'Hapus Catatan?',
      `Hapus catatan ${debt.type === 'receivable' ? 'piutang' : 'utang'} atas nama "${debt.personName}"?`,
      'Ya, Hapus',
      true
    );
    if (ok) {
      onDeleteDebt(debt.id);
      showToast('Catatan utang-piutang dihapus', 'info');
    }
  };

  // WhatsApp Reminder Link Generator
  const handleSendWhatsAppReminder = (debt: DebtRecord) => {
    const remaining = debt.totalAmount - debt.paidAmount;
    let cleanPhone = (debt.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const message = encodeURIComponent(
      `Halo ${debt.personName}, sekadar mengingatkan catatan terkait tanggungan sebesar ${formatRupiah(
        remaining
      )} dengan jatuh tempo pada ${formatDate(debt.dueDate)}. Terima kasih banyak ya! 🙏`
    );

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      // If no phone number entered, allow copy text
      navigator.clipboard?.writeText(decodeURIComponent(message));
      showToast('Teks pengingat disalin ke clipboard! 📋', 'success');
    }
  };

  const todayStr = getTodayDateString();

  return (
    <div className="space-y-6">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Piutang (Orang Utang ke Kita) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Total Piutang (Uang Kita)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                Akan Masuk
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-2 tracking-tight">
              {formatRupiah(summary.totalReceivable)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nominal dana yang dipinjamkan dan belum kita terima kembali
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => handleOpenAdd('receivable')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Piutang Baru</span>
            </button>
          </div>
        </div>

        {/* Utang (Kita Utang ke Orang) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>Total Utang (Kewajiban)</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20">
                Harus Dibayar
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-2 tracking-tight">
              {formatRupiah(summary.totalDebt)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nominal yang kita pinjam dan perlu dilunasi tepat waktu
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => handleOpenAdd('debt')}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Catat Utang Baru</span>
            </button>
          </div>
        </div>

        {/* Jatuh Tempo & Health */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Peringatan Jatuh Tempo</span>
              </span>
              {summary.overdueCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                  {summary.overdueCount} Melewati Batas
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                  Aman
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-white mt-2 tracking-tight">
              {summary.overdueCount > 0 ? (
                <span className="text-rose-400">{summary.overdueCount} Tagihan</span>
              ) : (
                <span className="text-emerald-400">Semua Terkendali</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary.overdueCount > 0
                ? 'Ada tagihan aktif yang telah melewati batas tanggal kesepakatan'
                : 'Tidak ada catatan pinjaman yang menunggak atau lewat batas hari ini'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Catatan: <strong>{debts.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterType('receivable')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'receivable'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Piutang (Uang Kita)</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('debt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'debt'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Utang (Kewajiban)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'unpaid' | 'paid')}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="paid">Sudah Lunas</option>
          </select>

          <button
            type="button"
            onClick={() => handleOpenAdd('receivable')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Baru</span>
          </button>
        </div>
      </div>

      {/* Debt List */}
      {filteredDebts.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <HandCoins className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">Tidak Ada Catatan Utang-Piutang</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Semua kewajiban dan tagihan Anda tercatat bersih tanpa beban tertunggak.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleOpenAdd('receivable')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              + Catat Piutang (Dipinjamkan)
            </button>
            <button
              onClick={() => handleOpenAdd('debt')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              + Catat Utang (Meminjam)
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDebts.map((item) => {
            const isReceivable = item.type === 'receivable';
            const remaining = Math.max(0, item.totalAmount - item.paidAmount);
            const isPaid = item.status === 'paid' || remaining === 0;
            const isOverdue = !isPaid && item.dueDate && item.dueDate < todayStr;
            const percent = Math.min(100, Math.round((item.paidAmount / item.totalAmount) * 100));

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isPaid
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                    : isOverdue
                    ? 'bg-rose-950/20 border-rose-800/50 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-xl'
                }`}
              >
                <div>
                  {/* Top Bar: Type & Due Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                        isReceivable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {isReceivable ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      <span>{isReceivable ? 'Piutang (Orang Pinjam)' : 'Utang (Kita Pinjam)'}</span>
                    </span>

                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Lunas</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Lewat Jatuh Tempo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        <Calendar className="w-3 h-3" />
                        <span>Tempo: {formatDate(item.dueDate)}</span>
                      </span>
                    )}
                  </div>

                  {/* Person Name & Phone */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{item.personName}</span>
                      </h4>
                      {item.phone && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{item.phone}</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      title="Hapus catatan"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Note if any */}
                  {item.note && (
                    <p className="text-xs text-slate-400 mt-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/60 line-clamp-2 italic">
                      "{item.note}"
                    </p>
                  )}

                  {/* Progress Bar & Amounts */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">
                        Sisa: <strong className={isPaid ? 'text-slate-400' : 'text-white font-bold'}>{formatRupiah(remaining)}</strong>
                      </span>
                      <span className="text-slate-400">
                        Total: <strong>{formatRupiah(item.totalAmount)}</strong>
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPaid
                            ? 'bg-emerald-400'
                            : isReceivable
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Sudah dicicil {formatRupiah(item.paidAmount)}</span>
                      <span>{percent}%</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
                  {!isPaid ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenPay(item)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${
                          isReceivable
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-950/40'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isReceivable ? 'Terima Cicilan' : 'Bayar Cicilan'}</span>
                      </button>

                      {isReceivable && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReminder(item)}
                          title="Kirim pengingat WhatsApp"
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-950/40 hover:text-emerald-400 hover:border-emerald-500/40 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Kirim Pengingat</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      ✓ Catatan Ini Telah Lunas
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Debt / Receivable */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {debtType === 'receivable' ? 'Catat Piutang (Orang Berutang)' : 'Catat Utang (Kita Berutang)'}
                </h3>
              </div>
              <button
                type="button"
                data-sound="cancel"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setDebtType('receivable')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  debtType === 'receivable'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Piutang (Uang Keluar)</span>
              </button>

              <button
                type="button"
                onClick={() => setDebtType('debt')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  debtType === 'debt'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Utang (Uang Masuk)</span>
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Pihak / Orang
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso / Pak RT"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. WhatsApp / Kontak
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Pokok Pinjaman (Rp)
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="Contoh: 500.000"
                  value={amountInput}
                  onChange={(e) => {
                    const num = parseNumberInput(e.target.value);
                    setAmountInput(num > 0 ? num.toLocaleString('id-ID') : '');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {debtType === 'receivable'
                    ? 'Diambil dari Dompet (Pengeluaran)'
                    : 'Dimasukkan ke Dompet (Pemasukan)'}
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.currentBalance ?? w.initialBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Keperluan darurat / modal usaha"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-sm text-white shadow-lg active:scale-95 transition-all ${
                    debtType === 'receivable'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 shadow-emerald-950/50'
                      : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 shadow-rose-950/50'
                  }`}
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Payment (Bayar Cicilan / Pelunasan) */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {selectedDebt.type === 'receivable' ? 'Terima Pembayaran Piutang' : 'Bayar Cicilan Utang'}
                </h3>
              </div>
              <button
                type="button"
                data-sound="cancel"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Information */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 mb-4 space-y-1">
              <div className="text-xs text-slate-400">Pihak Terkait:</div>
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>{selectedDebt.personName}</span>
                <span className="text-emerald-400">
                  Sisa: {formatRupiah(selectedDebt.totalAmount - selectedDebt.paidAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="Contoh: 100.000"
                  value={payAmountInput}
                  onChange={(e) => {
                    const num = parseNumberInput(e.target.value);
                    setPayAmountInput(num > 0 ? num.toLocaleString('id-ID') : '');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {selectedDebt.type === 'receivable'
                    ? 'Masuk ke Dompet'
                    : 'Bayar Menggunakan Dompet'}
                </label>
                <select
                  value={payWalletId}
                  onChange={(e) => setPayWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.currentBalance ?? w.initialBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Cicilan ke-1 / Pelunasan transfer"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
