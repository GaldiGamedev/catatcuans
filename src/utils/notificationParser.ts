import { ParsedNotification, TransactionType, Wallet, Category } from '../types';
import { getTodayDateString } from './formatters';

export function parseNotificationText(
  text: string,
  wallets: Wallet[],
  categories: Category[]
): ParsedNotification | null {
  if (!text || text.trim().length < 5) return null;

  const lower = text.toLowerCase();
  let type: TransactionType = 'expense';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // 1. Determine Transaction Type
  const isTransfer =
    lower.includes('transfer ke') ||
    lower.includes('transfer antar') ||
    lower.includes('top up') ||
    lower.includes('topup') ||
    lower.includes('trsf db ke') ||
    (lower.includes('transfer') && (lower.includes('biaya admin') || lower.includes('ke rekening') || lower.includes('ke bank')));

  const isIncome =
    lower.includes('transfer masuk') ||
    lower.includes('dana masuk') ||
    lower.includes('uang masuk') ||
    lower.includes('menerima saldo') ||
    lower.includes('penerimaan dana') ||
    lower.includes('gaji') ||
    lower.includes('cr ') ||
    lower.includes('kredit') ||
    lower.includes('terima dana') ||
    lower.includes('cashback') ||
    lower.includes('uang saku');

  if (isTransfer) {
    type = 'transfer';
    confidence = 'high';
  } else if (isIncome) {
    type = 'income';
    confidence = 'high';
  } else {
    // Check for expense keywords
    if (
      lower.includes('berhasil') ||
      lower.includes('sukses') ||
      lower.includes('pembayaran') ||
      lower.includes('qris') ||
      lower.includes('pembelian') ||
      lower.includes('bayar') ||
      lower.includes('debit') ||
      lower.includes('db ')
    ) {
      type = 'expense';
      confidence = 'high';
    } else {
      type = 'expense';
      confidence = 'medium';
    }
  }

  // 2. Extract Amount (Nominal)
  // Look for patterns like "Rp 150.000", "Rp150.000", "Rp 150000", "IDR 50.000", "sebesar 50.000"
  let amount = 0;
  let adminFee = 0;

  // Regex to find all currency amounts
  const amountRegex = /(?:rp\.?|idr)\s*([\d.,]+)/gi;
  const matches: number[] = [];
  let match;

  while ((match = amountRegex.exec(text)) !== null) {
    const rawNumStr = match[1].replace(/\./g, '').replace(/,/g, '');
    const val = parseInt(rawNumStr, 10);
    if (!isNaN(val) && val > 0) {
      matches.push(val);
    }
  }

  // Fallback: look for stand-alone numbers formatted like 50.000 or 150.000
  if (matches.length === 0) {
    const looseNumRegex = /\b(\d{1,3}(?:\.\d{3})+)\b/g;
    while ((match = looseNumRegex.exec(text)) !== null) {
      const val = parseInt(match[1].replace(/\./g, ''), 10);
      if (!isNaN(val) && val > 0) {
        matches.push(val);
      }
    }
  }

  // Detect admin fee explicitly
  const adminFeeRegex = /(?:biaya\s*admin|admin\s*fee|biaya)\s*(?:sebesar)?\s*(?:rp\.?|idr)?\s*([\d.,]+)/i;
  const adminMatch = text.match(adminFeeRegex);
  if (adminMatch) {
    const feeVal = parseInt(adminMatch[1].replace(/\./g, '').replace(/,/g, ''), 10);
    if (!isNaN(feeVal) && feeVal >= 0) {
      adminFee = feeVal;
    }
  }

  if (matches.length > 0) {
    // If we have adminFee separated, main amount is usually the larger one or the first one
    if (adminFee > 0 && matches.includes(adminFee) && matches.length > 1) {
      amount = matches.find((m) => m !== adminFee) || matches[0];
    } else {
      amount = matches[0];
    }
  }

  // 3. Match Wallets
  let suggestedWalletId: string | undefined = undefined;
  let suggestedToWalletId: string | undefined = undefined;

  // Find if wallet names exist in text
  for (const w of wallets) {
    const wNameLower = w.name.toLowerCase();
    if (lower.includes(wNameLower) || (wNameLower.includes('bca') && lower.includes('bca')) || (wNameLower.includes('gopay') && lower.includes('gopay')) || (wNameLower.includes('tunai') && lower.includes('tunai'))) {
      if (!suggestedWalletId) {
        suggestedWalletId = w.id;
      } else if (!suggestedToWalletId && suggestedWalletId !== w.id) {
        suggestedToWalletId = w.id;
      }
    }
  }

  // If no wallet matched, default to first wallet
  if (!suggestedWalletId && wallets.length > 0) {
    suggestedWalletId = wallets[0].id;
  }

  // If transfer, ensure toWalletId is different
  if (type === 'transfer' && !suggestedToWalletId) {
    const otherWallet = wallets.find((w) => w.id !== suggestedWalletId);
    suggestedToWalletId = otherWallet?.id;
  }

  // 4. Suggest Category
  let suggestedCategory = type === 'transfer' ? 'Transfer Antar Dompet' : 'Lain-lain';

  if (type === 'income') {
    if (lower.includes('gaji') || lower.includes('honor')) suggestedCategory = 'Gaji / Honor';
    else if (lower.includes('saku') || lower.includes('ortu')) suggestedCategory = 'Uang Saku';
    else if (lower.includes('freelance') || lower.includes('proyek')) suggestedCategory = 'Freelance & Side Job';
    else if (lower.includes('bonus') || lower.includes('hadiah') || lower.includes('cashback')) suggestedCategory = 'Bonus & Hadiah';
    else if (lower.includes('jual') || lower.includes('cuan')) suggestedCategory = 'Hasil Cuan / Usaha';
    else {
      const matchCat = categories.find((c) => c.type === 'income');
      if (matchCat) suggestedCategory = matchCat.name;
    }
  } else if (type === 'expense') {
    if (lower.includes('kopi') || lower.includes('makan') || lower.includes('resto') || lower.includes('cafe') || lower.includes('warung') || lower.includes('gofood') || lower.includes('shopeefood')) {
      suggestedCategory = 'Makanan & Minuman';
    } else if (lower.includes('gojek') || lower.includes('grab') || lower.includes('ojol') || lower.includes('bensin') || lower.includes('spbu') || lower.includes('parkir') || lower.includes('transport')) {
      suggestedCategory = 'Transportasi';
    } else if (lower.includes('pulsa') || lower.includes('kuota') || lower.includes('pln') || lower.includes('listrik') || lower.includes('telkom') || lower.includes('tagihan')) {
      suggestedCategory = 'Pulsa & Tagihan';
    } else if (lower.includes('belanja') || lower.includes('tokopedia') || lower.includes('shopee') || lower.includes('lazada') || lower.includes('minimarket') || lower.includes('indomaret') || lower.includes('alfamart')) {
      suggestedCategory = 'Belanja & Kebutuhan';
    } else if (lower.includes('game') || lower.includes('steam') || lower.includes('bioskop') || lower.includes('netflix') || lower.includes('spotify')) {
      suggestedCategory = 'Hiburan';
    } else {
      const matchCat = categories.find((c) => c.type === 'expense');
      if (matchCat) suggestedCategory = matchCat.name;
    }
  }

  // 5. Clean Note extraction
  // Trim up to 80 chars
  let note = text.replace(/\s+/g, ' ').trim();
  if (note.length > 70) {
    note = note.substring(0, 67) + '...';
  }

  return {
    rawText: text,
    type,
    amount,
    adminFee: type === 'transfer' ? adminFee : undefined,
    suggestedWalletId,
    suggestedToWalletId,
    suggestedCategory,
    note,
    date: getTodayDateString(),
    confidence,
  };
}

export const SAMPLE_NOTIFICATIONS = [
  {
    title: 'Bank Transfer Keluar (BI-Fast)',
    text: 'Transfer berhasil ke rekening BCA 5420918271 a.n Budi Pratama sebesar Rp 150.000 dengan biaya admin Rp 2.500 pada 12/09 14:15.',
  },
  {
    title: 'Transfer Masuk / Gaji',
    text: 'Transfer masuk Rp 750.000 dari PT SOLUSI DIGITAL via Rekening Bank ke rekening Anda. Berita: Gaji freelance artikel.',
  },
  {
    title: 'Top Up E-Wallet (GoPay)',
    text: 'Top up saldo E-Wallet sebesar Rp 100.000 dari Rekening Bank berhasil. Biaya admin Rp 1.000.',
  },
  {
    title: 'Pembayaran QRIS Kopi',
    text: 'Pembayaran QRIS sukses sebesar Rp 28.000 di Kopi Kenangan menggunakan Dompet Tunai.',
  },
  {
    title: 'Uang Saku Tunai',
    text: 'Penerimaan uang saku mingguan dari orang tua Rp 200.000 tunai.',
  },
];
