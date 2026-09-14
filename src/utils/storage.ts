import { Wallet, Transaction, Category, AppSettings, Budget, SavingsGoal, QuickSpend, DebtRecord } from '../types';

export const STORAGE_KEYS = {
  WALLETS: 'catatcuan_wallets_v1',
  TRANSACTIONS: 'catatcuan_transactions_v1',
  CATEGORIES: 'catatcuan_categories_v1',
  SETTINGS: 'catatcuan_settings_v1',
  BUDGETS: 'catatcuan_budgets_v1',
  SAVINGS: 'catatcuan_savings_v1',
  QUICK_SPENDS: 'catatcuan_quick_spends_v1',
  DEBTS: 'catatcuan_debts_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Galdi',
  userAvatar: '👤',
  userBio: 'Kelola keuangan dengan cerdas, tenang, dan terencana ✨',
  currencySymbol: 'Rp',
  currencyPosition: 'prefix',
  thousandSeparator: '.',
  salaryCycleDate: 1,
  startOfWeek: 'monday',
  budgetWarningThreshold: 80,
  defaultAdminFee: 0,
  privacyMode: false,
  pinLockEnabled: false,
  pinCode: '',
  compactMode: false,
  lowPowerMode: false,
  accentColor: 'emerald',
  soundEnabled: true,
  dailyReminderEnabled: false,
  dailyReminderTime: '20:00',
};

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'w-cash',
    name: 'Dompet Tunai',
    type: 'cash',
    color: '#10b981', // emerald
    icon: 'Wallet',
    initialBalance: 0,
  },
  {
    id: 'w-bank',
    name: 'Rekening Bank',
    type: 'bank',
    color: '#3b82f6', // blue
    icon: 'Building2',
    initialBalance: 0,
  },
  {
    id: 'w-ewallet',
    name: 'E-Wallet',
    type: 'ewallet',
    color: '#06b6d4', // cyan
    icon: 'Smartphone',
    initialBalance: 0,
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense
  { id: 'cat-food', name: 'Makanan & Minuman', type: 'expense', icon: 'Utensils', color: '#f97316' },
  { id: 'cat-transport', name: 'Transportasi', type: 'expense', icon: 'Bus', color: '#06b6d4' },
  { id: 'cat-shopping', name: 'Belanja & Kebutuhan', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'cat-bills', name: 'Pulsa & Tagihan', type: 'expense', icon: 'Receipt', color: '#eab308' },
  { id: 'cat-education', name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#3b82f6' },
  { id: 'cat-entertainment', name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#a855f7' },
  
  // Income
  { id: 'cat-allowance', name: 'Uang Saku', type: 'income', icon: 'Coins', color: '#10b981' },
  { id: 'cat-salary', name: 'Gaji / Honor', type: 'income', icon: 'Briefcase', color: '#3b82f6' },
  { id: 'cat-freelance', name: 'Freelance & Side Job', type: 'income', icon: 'Laptop', color: '#6366f1' },
  { id: 'cat-bonus', name: 'Bonus & Hadiah', type: 'income', icon: 'Gift', color: '#f59e0b' },
  { id: 'cat-investment', name: 'Hasil Cuan / Usaha', type: 'income', icon: 'TrendingUp', color: '#14b8a6' },
];

export const DEFAULT_BUDGETS: Budget[] = [];

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [];

export const DEFAULT_QUICK_SPENDS: QuickSpend[] = [];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export function getStoredWallets(): Wallet[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load wallets from localStorage', e);
  }
  return DEFAULT_WALLETS;
}

export function saveStoredWallets(wallets: Wallet[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  } catch (e) {
    console.error('Failed to save wallets to localStorage', e);
  }
}

export function getStoredTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load transactions from localStorage', e);
  }
  return DEFAULT_TRANSACTIONS;
}

export function saveStoredTransactions(transactions: Transaction[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function getStoredCategories(): Category[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load categories from localStorage', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveStoredCategories(categories: Category[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories to localStorage', e);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function getStoredBudgets(): Budget[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (data) {
      const parsed = JSON.parse(data);
      // If stored budgets only contain the old mock presets, clear to empty so target starts from 0
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((b: Budget) => ['b-food', 'b-transport', 'b-bills', 'b-shopping'].includes(b.id))) {
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([]));
        return [];
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load budgets', e);
  }
  return DEFAULT_BUDGETS;
}

export function saveStoredBudgets(budgets: Budget[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.error('Failed to save budgets', e);
  }
}

export function getStoredSavings(): SavingsGoal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SAVINGS);
    if (data) {
      const parsed = JSON.parse(data);
      // If stored savings only contain the old mock presets, clear to empty so target starts from 0
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((s: SavingsGoal) => ['g-emergency', 'g-gadget'].includes(s.id))) {
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify([]));
        return [];
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load savings', e);
  }
  return DEFAULT_SAVINGS_GOALS;
}

export function saveStoredSavings(savings: SavingsGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(savings));
  } catch (e) {
    console.error('Failed to save savings', e);
  }
}

export function getStoredQuickSpends(): QuickSpend[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUICK_SPENDS);
    if (data) {
      const parsed = JSON.parse(data);
      // If stored quick spends only contain the old mock presets ('qs-1' to 'qs-4'), clear to empty so it starts from 0
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((q: QuickSpend) => ['qs-1', 'qs-2', 'qs-3', 'qs-4'].includes(q.id))) {
        localStorage.setItem(STORAGE_KEYS.QUICK_SPENDS, JSON.stringify([]));
        return [];
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load quick spends', e);
  }
  return DEFAULT_QUICK_SPENDS;
}

export function saveStoredQuickSpends(quickSpends: QuickSpend[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.QUICK_SPENDS, JSON.stringify(quickSpends));
  } catch (e) {
    console.error('Failed to save quick spends', e);
  }
}

export function getStoredDebts(): DebtRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load debts', e);
  }
  return [];
}

export function saveStoredDebts(debts: DebtRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  } catch (e) {
    console.error('Failed to save debts', e);
  }
}

/**
 * Calculates current real-time balances for every wallet
 * taking into account initialBalance + income - expense - transfers - adminFees.
 */
export function calculateWalletBalances(wallets: Wallet[], transactions: Transaction[]): Wallet[] {
  return wallets.map((w) => {
    let balance = w.initialBalance || 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        if (tx.walletId === w.id) {
          balance += tx.amount;
        }
      } else if (tx.type === 'expense') {
        if (tx.walletId === w.id) {
          balance -= tx.amount;
        }
      } else if (tx.type === 'transfer') {
        if (tx.walletId === w.id) {
          // Source wallet loses transfer amount + admin fee
          balance -= (tx.amount + (tx.adminFee || 0));
        }
        if (tx.toWalletId === w.id) {
          // Target wallet receives transfer amount
          balance += tx.amount;
        }
      }
    }

    return {
      ...w,
      currentBalance: balance,
    };
  });
}

/**
 * Helper to export transactions into a CSV file
 */
export function exportToCSV(transactions: Transaction[], wallets: Wallet[]) {
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));

  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Biaya Admin', 'Dompet Sumber', 'Dompet Tujuan', 'Catatan'];
  const rows = transactions.map((t) => {
    const typeLabel = t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer';
    const sourceWallet = walletMap.get(t.walletId) || t.walletId;
    const destWallet = t.toWalletId ? (walletMap.get(t.toWalletId) || t.toWalletId) : '-';
    const cleanNote = (t.note || '').replace(/"/g, '""');

    return [
      t.date,
      typeLabel,
      `"${t.category || '-'}"`,
      t.amount,
      t.adminFee || 0,
      `"${sourceWallet}"`,
      `"${destWallet}"`,
      `"${cleanNote}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // \uFEFF for Excel UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `catatcuan-transaksi-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
