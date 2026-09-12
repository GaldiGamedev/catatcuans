import { Wallet, Transaction, Category, AppSettings } from '../types';

export const STORAGE_KEYS = {
  WALLETS: 'catatcuan_wallets_v1',
  TRANSACTIONS: 'catatcuan_transactions_v1',
  CATEGORIES: 'catatcuan_categories_v1',
  SETTINGS: 'catatcuan_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoDetectNotification: true,
  privacyMode: false,
  lowPowerMode: false,
  defaultAdminFee: 0,
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
