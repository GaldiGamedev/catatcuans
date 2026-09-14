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

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  icon?: string;
  color?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  icon: string;
  color: string;
  walletId?: string;
}

export interface QuickSpend {
  id: string;
  name: string;
  amount: number;
  category: string;
  walletId?: string;
  icon: string;
}

export interface AppSettings {
  userName: string;
  userAvatar: string;
  userBio: string;
  currencySymbol: string;
  currencyPosition: 'prefix' | 'suffix';
  thousandSeparator: '.' | ',';
  salaryCycleDate: number; // e.g. 1 - 28
  startOfWeek: 'monday' | 'sunday';
  budgetWarningThreshold: number; // e.g. 80 (%)
  defaultAdminFee: number;
  privacyMode: boolean; // Sembunyikan nominal saldo
  pinLockEnabled: boolean; // Kunci PIN saat buka web
  pinCode?: string; // 4-6 digit PIN
  compactMode: boolean;
  lowPowerMode: boolean;
  accentColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
  soundEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
}

export type DebtType = 'debt' | 'receivable'; // 'debt' (kita berutang ke orang) | 'receivable' (orang berutang ke kita / piutang)

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  walletId: string;
  note?: string;
  createdAt: number;
}

export interface DebtRecord {
  id: string;
  type: DebtType;
  personName: string;
  phone?: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'unpaid' | 'partial' | 'paid';
  walletId?: string; // Dompet terkait untuk pencatatan kas
  note?: string;
  createdAt: number;
  payments: DebtPayment[];
}
