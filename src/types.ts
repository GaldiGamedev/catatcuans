export type TransactionType = 'income' | 'expense' | 'transfer';

export type WalletType = 'cash' | 'bank' | 'ewallet' | 'savings';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  color: string;
  icon: string;
  initialBalance: number;
  currentBalance?: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  walletId: string; // Source wallet, or destination wallet for income
  toWalletId?: string; // Destination wallet if transfer
  adminFee?: number; // Fee for transfer (e.g. 2500, 6500, 0)
  note?: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export type DateFilter = 'all' | 'today' | 'this_week' | 'this_month';

export interface AppSettings {
  autoDetectNotification: boolean;
  privacyMode: boolean; // Hide balances with stars (Rp ••••••)
  lowPowerMode: boolean; // Ultra light mode for low-end phones
  defaultWalletId?: string;
  defaultAdminFee: number;
}

export interface ParsedNotification {
  rawText: string;
  type: TransactionType;
  amount: number;
  adminFee?: number;
  suggestedWalletId?: string;
  suggestedToWalletId?: string;
  suggestedCategory: string;
  note: string;
  date: string;
  confidence: 'high' | 'medium' | 'low';
}

