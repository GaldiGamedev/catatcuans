import React, { useState, useRef } from 'react';
import {
  Camera,
  UploadCloud,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Store,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Category, ReceiptScanResult, Wallet } from '../types';
import { formatRupiah, formatDate, getTodayDateString } from '../utils/formatters';
import { showToast } from '../utils/sweetalert';
import { soundFx } from '../utils/audio';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  wallets: Wallet[];
  onApplyScan: (data: {
    amount: number;
    date: string;
    note: string;
    category?: string;
    merchantName?: string;
  }) => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  categories,
  wallets,
  onApplyScan,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Editable parsed fields after scan
  const [editableMerchant, setEditableMerchant] = useState('');
  const [editableAmount, setEditableAmount] = useState<string>('');
  const [editableDate, setEditableDate] = useState(getTodayDateString());
  const [editableCategory, setEditableCategory] = useState('');
  const [editableNote, setEditableNote] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setIsScanning(false);
    setScanResult(null);
    setErrorMessage(null);
    setEditableMerchant('');
    setEditableAmount('');
    setEditableDate(getTodayDateString());
    setEditableCategory('');
    setEditableNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Mohon unggah file foto nota gambar (JPG, PNG, WEBP)', 'error');
      return;
    }

    // Limit check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran foto terlalu besar (maksimal 10MB)', 'error');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileProcess(files[0]);
    }
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleStartScan = async () => {
    if (!selectedFile && !imagePreview) {
      showToast('Pilih atau foto nota struk belanja terlebih dahulu', 'error');
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);

    try {
      let base64Data = imagePreview;
      if (!base64Data && selectedFile) {
        base64Data = await fileToBase64(selectedFile);
      }

      const mimeType = selectedFile?.type || 'image/jpeg';

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengenali teks nota belanja.');
      }

      const resData: ReceiptScanResult = json.data;
      setScanResult(resData);

      // Populate editable fields
      const merchant = resData.merchantName || 'Belanja Nota';
      const amount = resData.totalAmount || 0;
      const parsedDate = resData.date || getTodayDateString();
      const noteGenerated = resData.notes || `Belanja di ${merchant}`;

      setEditableMerchant(merchant);
      setEditableAmount(amount > 0 ? String(amount) : '');
      setEditableDate(parsedDate);
      setEditableNote(noteGenerated);

      // Match closest category
      if (resData.category) {
        const found = categories.find(
          (c) =>
            c.name.toLowerCase().includes(resData.category!.toLowerCase()) ||
            resData.category!.toLowerCase().includes(c.name.toLowerCase())
        );
        if (found) {
          setEditableCategory(found.name);
        } else {
          // Default to expense matching
          const expenseCat = categories.find((c) => c.type === 'expense');
          setEditableCategory(expenseCat ? expenseCat.name : 'Belanja Harian');
        }
      } else {
        const expenseCat = categories.find((c) => c.type === 'expense');
        setEditableCategory(expenseCat ? expenseCat.name : 'Belanja Harian');
      }

      soundFx.playCashRegister();
      showToast('Struk belanja berhasil dianalisis dengan AI!', 'success');
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(
        err.message || 'Terjadi gangguan saat memindai nota. Anda tetap dapat memasukkan nominal manual.'
      );
      showToast('Gagal memindai nota secara otomatis', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyToForm = () => {
    const finalAmount = parseInt(editableAmount.replace(/\D/g, ''), 10) || 0;
    if (finalAmount <= 0) {
      showToast('Nominal transaksi harus lebih dari 0', 'error');
      return;
    }

    onApplyScan({
      amount: finalAmount,
      date: editableDate || getTodayDateString(),
      note: editableNote.trim() || `Belanja di ${editableMerchant.trim() || 'Toko'}`,
      category: editableCategory || 'Belanja Harian',
      merchantName: editableMerchant.trim(),
    });

    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/40">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Pindai Nota Belanja (Smart OCR)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  AI Gemini
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Otomatis isi nominal, tanggal, & nama toko dari foto struk belanja
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            data-sound="cancel"
            aria-label="Tutup"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Hidden inputs for gallery & camera */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileProcess(file);
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileProcess(file);
            }}
          />

          {!imagePreview ? (
            /* Upload Box with Drag and Drop */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3.5 ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
                <UploadCloud className="w-8 h-8 stroke-[1.8]" />
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Tarik & Lepas Foto Nota atau Pilih File
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Mendukung foto struk Indomaret, Alfamart, restoran, tagihan listrik, bukti transfer, hingga nota kasir warung (JPG, PNG, WEBP maks 10MB).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Pilih dari Galeri</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto Nota</span>
                </button>
              </div>
            </div>
          ) : (
            /* Image Preview & Scan Panel */
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-60 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Nota Preview"
                  referrerPolicy="no-referrer"
                  className="max-h-60 w-auto object-contain rounded-xl"
                />

                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 transition-colors"
                    title="Ganti Foto"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action: Process / Re-scan */}
              {!scanResult && !isScanning && (
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-colors"
                  >
                    Ganti Foto
                  </button>

                  <button
                    type="button"
                    onClick={handleStartScan}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mulai Analisis Nota dengan AI</span>
                  </button>
                </div>
              )}

              {/* Scanning indicator */}
              {isScanning && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-center gap-3 animate-pulse">
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  <span className="text-xs sm:text-sm font-semibold text-emerald-300">
                    Sedang membaca nominal, tanggal, dan nama toko dari struk belanja...
                  </span>
                </div>
              )}

              {/* Error state */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pemindaian Terkendala:</span> {errorMessage}
                  </div>
                </div>
              )}

              {/* Extracted Form Editor */}
              {scanResult && (
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Data Berhasil Ditemukan</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleStartScan}
                      className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Scan Ulang</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Merchant Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Nama Toko / Tempat
                      </label>
                      <div className="relative">
                        <Store className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={editableMerchant}
                          onChange={(e) => setEditableMerchant(e.target.value)}
                          className="w-full py-2 pl-9 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:border-emerald-500 outline-none"
                          placeholder="Nama Toko"
                        />
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Total Nominal (Rp) <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-emerald-400">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editableAmount ? Number(editableAmount).toLocaleString('id-ID') : ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setEditableAmount(val);
                          }}
                          className="w-full py-2 pl-9 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-black text-emerald-300 focus:border-emerald-500 outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Transaction Date */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Tanggal Struk
                      </label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="date"
                          value={editableDate}
                          onChange={(e) => setEditableDate(e.target.value)}
                          className="w-full py-2 pl-9 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Kategori Transaksi
                      </label>
                      <div className="relative">
                        <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                        <select
                          value={editableCategory}
                          onChange={(e) => setEditableCategory(e.target.value)}
                          className="w-full py-2 pl-9 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:border-emerald-500 outline-none"
                        >
                          {categories
                            .filter((c) => c.type === 'expense')
                            .map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          <option value="Belanja Harian">Belanja Harian</option>
                          <option value="Lain-lain">Lain-lain</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Note / Description */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Catatan / Rincian Belanja
                    </label>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={editableNote}
                        onChange={(e) => setEditableNote(e.target.value)}
                        className="w-full py-2 pl-9 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-emerald-500 outline-none"
                        placeholder="Contoh: Belanja bahan pokok di Alfamart"
                      />
                    </div>
                  </div>

                  {/* Scanned items preview if available */}
                  {scanResult.items && scanResult.items.length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                        Rincian Barang Terdeteksi ({scanResult.items.length} item):
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-[11px]">
                        {scanResult.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-slate-300 py-0.5 border-b border-slate-800/40"
                          >
                            <span className="truncate max-w-[200px]">
                              {item.name} {item.qty ? `(x${item.qty})` : ''}
                            </span>
                            <span className="font-semibold text-slate-400">
                              {item.price ? formatRupiah(item.price) : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final CTA button to insert into form */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleApplyToForm}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <span>Gunakan Data Ini di Pencatatan Transaksi</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
