import React, { useState, useEffect, useMemo } from 'react';
import { Home, Target, PieChart, Sparkles, HandCoins } from 'lucide-react';
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { WalletsSection } from './components/WalletsSection';
import { TransactionList } from './components/TransactionList';
import { AnalyticsSection } from './components/AnalyticsSection';
import { TransactionModal } from './components/TransactionModal';
import { WalletModal } from './components/WalletModal';
import { CategoryModal } from './components/CategoryModal';
import { BottomNavMobile } from './components/BottomNavMobile';
import { SettingsModal } from './components/SettingsModal';
import { BudgetSection } from './components/BudgetSection';
import { SavingsSection } from './components/SavingsSection';
import { QuickSpendsBar } from './components/QuickSpendsBar';
import { DebtSection } from './components/DebtSection';
import { PinLockModal } from './components/PinLockModal';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import { AuthModal } from './components/AuthModal';
import {
  auth,
  onAuthStateChanged,
  User,
  loadUserCloudData,
  saveUserCloudData,
  testFirestoreConnection,
} from './utils/firebase';
import {
  Wallet,
  Transaction,
  Category,
  TransactionType,
  AppSettings,
  Budget,
  SavingsGoal,
  QuickSpend,
  DebtRecord,
} from './types';
import {
  getStoredWallets,
  saveStoredWallets,
  getStoredTransactions,
  saveStoredTransactions,
  getStoredCategories,
  saveStoredCategories,
  getStoredSettings,
  saveStoredSettings,
  getStoredBudgets,
  saveStoredBudgets,
  getStoredSavings,
  saveStoredSavings,
  getStoredQuickSpends,
  saveStoredQuickSpends,
  getStoredDebts,
  saveStoredDebts,
  calculateWalletBalances,
  DEFAULT_CATEGORIES,
  DEFAULT_WALLETS,
} from './utils/storage';
import { showToast, showSuccessAlert } from './utils/sweetalert';
import { formatRupiah, getTodayDateString } from './utils/formatters';
import { soundFx } from './utils/audio';

export default function App() {
  // Primary State
  const [rawWallets, setRawWallets] = useState<Wallet[]>(() => getStoredWallets());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());
  const [budgets, setBudgets] = useState<Budget[]>(() => getStoredBudgets());
  const [savings, setSavings] = useState<SavingsGoal[]>(() => getStoredSavings());
  const [quickSpends, setQuickSpends] = useState<QuickSpend[]>(() => getStoredQuickSpends());
  const [debts, setDebts] = useState<DebtRecord[]>(() => getStoredDebts());

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('catatcuan_guest_mode') === 'true';
  });
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<number | null>(() => {
    const val = localStorage.getItem('catatcuan_last_sync');
    return val ? parseInt(val, 10) : null;
  });

  // Security Lock
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const s = getStoredSettings();
    return !s.pinLockEnabled;
  });

  // Navigation & Filtering
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'budget' | 'debt' | 'analytics'>('home');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txDefaultType, setTxDefaultType] = useState<TransactionType>('expense');
  const [txDefaultSourceWallet, setTxDefaultSourceWallet] = useState<string | undefined>(undefined);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReceiptScanOpen, setIsReceiptScanOpen] = useState(false);
  const [txPrefillData, setTxPrefillData] = useState<{
    amount?: number;
    date?: string;
    note?: string;
    category?: string;
  } | undefined>(undefined);

  // Initialize Firebase Auth & Sync listener
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);

      if (user) {
        setIsGuestMode(false);
        localStorage.removeItem('catatcuan_guest_mode');

        // Update username from user profile if not customized
        if (user.displayName) {
          setSettings((prev) => {
            if (prev.userName === 'Galdi' || !prev.userName) {
              return { ...prev, userName: user.displayName! };
            }
            return prev;
          });
        }

        // Fetch Cloud Data from Firestore
        try {
          setIsCloudSyncing(true);
          const cloudData = await loadUserCloudData(user.uid);
          if (cloudData) {
            if (cloudData.wallets && cloudData.wallets.length > 0) setRawWallets(cloudData.wallets);
            if (cloudData.transactions) setTransactions(cloudData.transactions);
            if (cloudData.categories && cloudData.categories.length > 0) setCategories(cloudData.categories);
            if (cloudData.budgets) setBudgets(cloudData.budgets);
            if (cloudData.savings) setSavings(cloudData.savings);
            if (cloudData.quickSpends) setQuickSpends(cloudData.quickSpends);
            if (cloudData.debts) setDebts(cloudData.debts);
            if (cloudData.settings) setSettings((prev) => ({ ...prev, ...cloudData.settings }));
            const syncTime = cloudData.lastSyncedAt || Date.now();
            setLastSyncedTime(syncTime);
            localStorage.setItem('catatcuan_last_sync', syncTime.toString());
          } else {
            // First time this user logs in: save existing local data to Firestore
            await saveUserCloudData(user.uid, {
              wallets: rawWallets,
              transactions,
              categories,
              budgets,
              savings,
              quickSpends,
              debts,
              settings,
              lastSyncedAt: Date.now(),
            });
            const syncTime = Date.now();
            setLastSyncedTime(syncTime);
            localStorage.setItem('catatcuan_last_sync', syncTime.toString());
          }
        } catch (err) {
          console.warn('Could not load user data from cloud:', err);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Debounced auto-save to Cloud Firestore when data changes and user is authenticated
  useEffect(() => {
    if (!currentUser || isAuthChecking) return;

    const timer = setTimeout(async () => {
      try {
        setIsCloudSyncing(true);
        await saveUserCloudData(currentUser.uid, {
          wallets: rawWallets,
          transactions,
          categories,
          budgets,
          savings,
          quickSpends,
          debts,
          settings,
          lastSyncedAt: Date.now(),
        });
        const syncTime = Date.now();
        setLastSyncedTime(syncTime);
        localStorage.setItem('catatcuan_last_sync', syncTime.toString());
      } catch (err) {
        console.warn('Auto cloud sync error:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentUser, rawWallets, transactions, categories, budgets, savings, quickSpends, debts, settings, isAuthChecking]);

  // Manual Cloud Sync trigger
  const handleManualSync = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      setIsCloudSyncing(true);
      await saveUserCloudData(currentUser.uid, {
        wallets: rawWallets,
        transactions,
        categories,
        budgets,
        savings,
        quickSpends,
        debts,
        settings,
        lastSyncedAt: Date.now(),
      });
      const syncTime = Date.now();
      setLastSyncedTime(syncTime);
      localStorage.setItem('catatcuan_last_sync', syncTime.toString());
      showToast('Data berhasil disinkronkan ke Cloud Firestore!', 'success');
    } catch (err: any) {
      showToast('Gagal sinkronisasi data: ' + (err.message || 'Periksa koneksi internet'), 'error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleContinueAsGuest = () => {
    setIsGuestMode(true);
    localStorage.setItem('catatcuan_guest_mode', 'true');
    setIsAuthModalOpen(false);
    showToast('Masuk sebagai Tamu (Data disimpan di browser ini)', 'info');
  };

  // Sync to LocalStorage
  useEffect(() => {
    saveStoredWallets(rawWallets);
  }, [rawWallets]);

  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveStoredSettings(settings);
    soundFx.setEnabled(settings.soundEnabled);
  }, [settings]);

  useEffect(() => {
    saveStoredBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    saveStoredSavings(savings);
  }, [savings]);

  useEffect(() => {
    saveStoredQuickSpends(quickSpends);
  }, [quickSpends]);

  useEffect(() => {
    saveStoredDebts(debts);
  }, [debts]);

  // Compute real-time balances for all wallets
  const wallets = useMemo(() => {
    return calculateWalletBalances(rawWallets, transactions);
  }, [rawWallets, transactions]);

  // Financial Overview Aggregations
  const overview = useMemo(() => {
    const totalBalance = wallets.reduce(
      (sum, w) => sum + (w.currentBalance ?? w.initialBalance),
      0
    );

    let totalIncome = 0;
    let totalExpense = 0;
    let totalAdminFees = 0;

    for (const tx of transactions) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
      } else if (tx.type === 'transfer') {
        if (tx.adminFee) {
          totalAdminFees += tx.adminFee;
        }
      }
    }

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      totalAdminFees,
      transactionCount: transactions.length,
    };
  }, [wallets, transactions]);

  // Transaction Actions
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (settings.soundEnabled) {
      soundFx.playCashRegister();
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // Quick Spend Trigger (1-tap recording)
  const handleLogQuickSpend = (qs: QuickSpend) => {
    const chosenWallet = wallets.find((w) => w.id === qs.walletId) || wallets[0];
    if (!chosenWallet) {
      showToast('Belum ada dompet aktif', 'error');
      return;
    }

    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      type: 'expense',
      amount: qs.amount,
      date: getTodayDateString(),
      category: qs.category,
      walletId: chosenWallet.id,
      note: `Pintasan cepat: ${qs.name}`,
      createdAt: Date.now(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    if (settings.soundEnabled) {
      soundFx.playCashRegister();
    }
    showToast(`Tercatat: ${qs.name} ${formatRupiah(qs.amount)} dari ${chosenWallet.name}`, 'success');
  };

  const handleAddQuickSpend = (newQS: QuickSpend) => {
    setQuickSpends((prev) => [...prev, newQS]);
  };

  const handleDeleteQuickSpend = (id: string) => {
    setQuickSpends((prev) => prev.filter((q) => q.id !== id));
  };

  // Budget Actions
  const handleSaveBudget = (b: Budget) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((item) => item.id === b.id || item.categoryName === b.categoryName);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = b;
        return next;
      }
      return [...prev, b];
    });
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
  };

  // Savings Actions
  const handleSaveSaving = (goal: SavingsGoal) => {
    setSavings((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = goal;
        return next;
      }
      return [...prev, goal];
    });
  };

  const handleDeleteSaving = (goalId: string) => {
    setSavings((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleDepositSaving = (savingId: string, amount: number, sourceWalletId?: string) => {
    setSavings((prev) =>
      prev.map((g) => {
        if (g.id === savingId) {
          return { ...g, currentAmount: g.currentAmount + amount };
        }
        return g;
      })
    );

    // If source wallet specified, deduct balance by recording expense to celengan
    if (sourceWalletId) {
      const goal = savings.find((g) => g.id === savingId);
      const newTx: Transaction = {
        id: 'tx-save-' + Date.now(),
        type: 'expense',
        amount,
        date: getTodayDateString(),
        category: 'Hasil Cuan / Usaha',
        walletId: sourceWalletId,
        note: `Setoran Celengan: ${goal?.name || 'Tabungan'}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleWithdrawSaving = (savingId: string, amount: number, destWalletId?: string) => {
    setSavings((prev) =>
      prev.map((g) => {
        if (g.id === savingId) {
          return { ...g, currentAmount: Math.max(0, g.currentAmount - amount) };
        }
        return g;
      })
    );

    // If destination wallet specified, add income
    if (destWalletId) {
      const goal = savings.find((g) => g.id === savingId);
      const newTx: Transaction = {
        id: 'tx-withdraw-' + Date.now(),
        type: 'income',
        amount,
        date: getTodayDateString(),
        category: 'Hasil Cuan / Usaha',
        walletId: destWalletId,
        note: `Penarikan Celengan: ${goal?.name || 'Tabungan'}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  // Debt & Loan Actions
  const handleSaveDebt = (newDebt: DebtRecord) => {
    setDebts((prev) => [newDebt, ...prev]);

    // If a wallet is specified, create corresponding initial cash movement:
    // Receivable (kita pinjamkan uang keluar) -> Expense
    // Debt (kita pinjam uang masuk) -> Income
    if (newDebt.walletId) {
      const isReceivable = newDebt.type === 'receivable';
      const tx: Transaction = {
        id: 'tx-debt-' + Date.now(),
        type: isReceivable ? 'expense' : 'income',
        amount: newDebt.totalAmount,
        date: getTodayDateString(),
        category: isReceivable ? 'Pinjaman / Piutang' : 'Utang / Pinjaman',
        walletId: newDebt.walletId,
        note: `${isReceivable ? 'Piutang' : 'Utang'}: ${newDebt.personName} (${newDebt.note || 'Tercatat'})`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    if (settings.soundEnabled) {
      soundFx.playCashRegister();
    }
  };

  const handleDeleteDebt = (debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
  };

  const handlePayDebt = (debtId: string, amount: number, walletId: string, note?: string) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          const newPaid = d.paidAmount + amount;
          const isLunas = newPaid >= d.totalAmount;
          return {
            ...d,
            paidAmount: newPaid,
            status: isLunas ? 'paid' : 'partial',
            payments: [
              ...d.payments,
              {
                id: 'pay-' + Date.now(),
                amount,
                date: getTodayDateString(),
                walletId,
                note,
                createdAt: Date.now(),
              },
            ],
          };
        }
        return d;
      })
    );

    // Record cash transaction:
    // When paying our debt -> Expense from our wallet
    // When receiving payment for our receivable -> Income to our wallet
    const targetDebt = debts.find((d) => d.id === debtId);
    if (targetDebt) {
      const isReceivable = targetDebt.type === 'receivable';
      const tx: Transaction = {
        id: 'tx-pay-debt-' + Date.now(),
        type: isReceivable ? 'income' : 'expense',
        amount,
        date: getTodayDateString(),
        category: isReceivable ? 'Pelunasan Piutang' : 'Pelunasan Utang',
        walletId,
        note: `Cicilan/Pelunasan ${isReceivable ? 'piutang dari' : 'utang ke'} ${targetDebt.personName}${
          note ? ` (${note})` : ''
        }`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    if (settings.soundEnabled) {
      soundFx.playCashRegister();
    }
  };

  // Wallet Actions
  const handleOpenWalletModal = (wallet?: Wallet) => {
    setWalletToEdit(wallet || null);
    setIsWalletModalOpen(true);
  };

  const handleSaveWallet = (
    walletData: Omit<Wallet, 'id'>,
    idToEdit?: string
  ) => {
    if (idToEdit) {
      setRawWallets((prev) =>
        prev.map((w) => (w.id === idToEdit ? { ...w, ...walletData } : w))
      );
    } else {
      const newWallet: Wallet = {
        ...walletData,
        id: 'w-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      };
      setRawWallets((prev) => [...prev, newWallet]);
    }
  };

  const handleDeleteWallet = (walletId: string) => {
    setRawWallets((prev) => prev.filter((w) => w.id !== walletId));
    if (selectedWalletId === walletId) {
      setSelectedWalletId(null);
    }
  };

  // Category Actions
  const handleAddCategory = (catData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...catData,
      id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    setCategories((prev) => [...prev, newCategory]);
  };

  const handleUpdateCategory = (updatedCat: Category, oldName?: string) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
    if (oldName && oldName !== updatedCat.name) {
      setTransactions((prev) =>
        prev.map((t) => (t.category === oldName ? { ...t, category: updatedCat.name } : t))
      );
      setBudgets((prev) =>
        prev.map((b) => (b.categoryName === oldName ? { ...b, categoryName: updatedCat.name } : b))
      );
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResetCategories = () => {
    setCategories(DEFAULT_CATEGORIES);
  };

  // Data Reset/Restore
  const handleResetData = (
    newWallets: Wallet[],
    newTransactions: Transaction[],
    newCategories: Category[]
  ) => {
    setRawWallets(newWallets);
    setTransactions(newTransactions);
    setCategories(newCategories);
    setSelectedWalletId(null);
  };

  // Load rich demo simulation data
  const handleLoadDemoData = () => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');

    const demoWallets: Wallet[] = [
      { id: 'w-cash', name: 'Dompet Tunai', type: 'cash', color: '#10b981', icon: 'Wallet', initialBalance: 500000 },
      { id: 'w-bank', name: 'BCA Prioritas', type: 'bank', color: '#3b82f6', icon: 'Building2', initialBalance: 8500000 },
      { id: 'w-ewallet', name: 'DANA & GoPay', type: 'ewallet', color: '#06b6d4', icon: 'Smartphone', initialBalance: 750000 },
    ];

    const demoTransactions: Transaction[] = [
      {
        id: 'demo-1',
        type: 'income',
        amount: 8500000,
        date: `${curYear}-${curMonth}-01`,
        category: 'Gaji / Honor',
        walletId: 'w-bank',
        note: 'Gaji Bulanan Masuk Rekening BCA',
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        id: 'demo-2',
        type: 'transfer',
        amount: 1000000,
        adminFee: 2500,
        date: `${curYear}-${curMonth}-02`,
        category: 'Transfer',
        walletId: 'w-bank',
        toWalletId: 'w-ewallet',
        note: 'Top Up saldo e-wallet via BI-Fast',
        createdAt: Date.now() - 86400000 * 4,
      },
      {
        id: 'demo-3',
        type: 'expense',
        amount: 125000,
        date: `${curYear}-${curMonth}-03`,
        category: 'Makanan & Minuman',
        walletId: 'w-ewallet',
        note: 'Makan bareng teman di Resto',
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: 'demo-4',
        type: 'expense',
        amount: 350000,
        date: `${curYear}-${curMonth}-04`,
        category: 'Pulsa & Tagihan',
        walletId: 'w-bank',
        note: 'Bayar Wifi & Listrik PLN Bulanan',
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'demo-5',
        type: 'expense',
        amount: 35000,
        date: `${curYear}-${curMonth}-05`,
        category: 'Transportasi',
        walletId: 'w-cash',
        note: 'Bensin Motor Shell Super',
        createdAt: Date.now() - 86400000,
      },
    ];

    setRawWallets(demoWallets);
    setTransactions(demoTransactions);
    showSuccessAlert('Data Simulasi Dimuat! 🚀', 'Kini Anda bisa melihat grafik mutasi, alokasi anggaran, dan celengan impian.');
    setIsSettingsOpen(false);
  };

  const handleOpenTransferModalWithSource = (walletId: string) => {
    setTxDefaultType('transfer');
    setTxDefaultSourceWallet(walletId);
    setIsTxModalOpen(true);
  };

  const handleOpenNewTransaction = (type: TransactionType = 'expense') => {
    setTxDefaultType(type);
    setTxDefaultSourceWallet(selectedWalletId || undefined);
    setTxPrefillData(undefined);
    setIsTxModalOpen(true);
  };

  const handleApplyReceiptScan = (data: {
    amount: number;
    date: string;
    note: string;
    category?: string;
    merchantName?: string;
  }) => {
    setTxDefaultType('expense');
    setTxPrefillData({
      amount: data.amount,
      date: data.date,
      note: data.note,
      category: data.category,
    });
    setIsReceiptScanOpen(false);
    setIsTxModalOpen(true);
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-10 ${
        settings.compactMode ? 'text-xs' : ''
      }`}
    >
      {/* Background ambient light - disabled in lowPowerMode */}
      {!settings.lowPowerMode && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenTransactionModal={() => handleOpenNewTransaction('expense')}
        onOpenReceiptScan={() => setIsReceiptScanOpen(true)}
        onOpenWalletModal={() => handleOpenWalletModal()}
        onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        wallets={wallets}
        transactions={transactions}
        categories={categories}
        debts={debts}
        settings={settings}
        onTogglePrivacy={() => setSettings((s) => ({ ...s, privacyMode: !s.privacyMode }))}
        onResetData={handleResetData}
        currentTab={activeTab}
        onChangeTab={setActiveTab}
        budgetsCount={budgets.length}
        savingsCount={savings.length}
        debtsCount={debts.length}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isCloudSyncing={isCloudSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10 space-y-6">
        {/* Desktop / Tablet Navigation Tabs Bar */}
        <div className="hidden md:flex items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/90 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Ringkasan Kas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'budget'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Target & Celengan</span>
              {(budgets.length > 0 || savings.length > 0) && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {budgets.length + savings.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('debt')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'debt'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HandCoins className="w-4 h-4" />
              <span>Utang-Piutang</span>
              {debts.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  {debts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Analitik & Grafik</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden lg:flex items-center gap-2">
            <span>{wallets.length} Dompet Aktif</span>
            <span>•</span>
            <span>{transactions.length} Transaksi Tercatat</span>
            {debts.length > 0 && (
              <>
                <span>•</span>
                <span>{debts.length} Catatan Utang</span>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Ringkasan Kas (Home) - Cleaned up without Target Anggaran & Celengan */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Quick Spends 1-Tap Bar */}
            <QuickSpendsBar
              quickSpends={quickSpends}
              wallets={wallets}
              categories={categories}
              onLogQuickSpend={handleLogQuickSpend}
              onAddQuickSpend={handleAddQuickSpend}
              onDeleteQuickSpend={handleDeleteQuickSpend}
            />

            {/* Top Overview Cards */}
            <OverviewCards
              totalBalance={overview.totalBalance}
              totalIncome={overview.totalIncome}
              totalExpense={overview.totalExpense}
              totalAdminFees={overview.totalAdminFees}
              transactionCount={overview.transactionCount}
              privacyMode={settings.privacyMode}
            />

            {/* Wallets Horizontal / Grid Section */}
            <WalletsSection
              wallets={wallets}
              selectedWalletId={selectedWalletId}
              onSelectWallet={setSelectedWalletId}
              onOpenWalletModal={handleOpenWalletModal}
              onOpenTransferModalWithSource={handleOpenTransferModalWithSource}
              onDeleteWallet={handleDeleteWallet}
              privacyMode={settings.privacyMode}
            />

            {/* Main Grid: Left Transactions List, Right Analytics Mini Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Columns: Transaction History */}
              <div className="lg:col-span-8">
                <TransactionList
                  transactions={transactions}
                  wallets={wallets}
                  selectedWalletId={selectedWalletId}
                  onSelectWallet={setSelectedWalletId}
                  onDeleteTransaction={handleDeleteTransaction}
                  onOpenNewTransaction={() => handleOpenNewTransaction('expense')}
                />
              </div>

              {/* Right 4 Columns: Analytics Breakdown */}
              <div className="lg:col-span-4 space-y-6">
                <AnalyticsSection transactions={transactions} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dedicated Target Anggaran & Celengan Impian Page */}
        {activeTab === 'budget' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header / Intro Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/20 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <span>Target Anggaran & Celengan Impian</span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Rencanakan batas belanja bulanan dan kumpulkan tabungan celengan terpisah dari saldo belanja.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
                <div className="flex-1 sm:flex-initial px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-medium">Batas Anggaran</div>
                  <div className="text-sm font-bold text-emerald-400">{budgets.length} Kategori</div>
                </div>
                <div className="flex-1 sm:flex-initial px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-medium">Target Celengan</div>
                  <div className="text-sm font-bold text-teal-400">{savings.length} Target</div>
                </div>
              </div>
            </div>

            {/* Target Anggaran Bulanan Section */}
            <BudgetSection
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
              onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
            />

            {/* Celengan & Target Impian Section */}
            <SavingsSection
              savings={savings}
              wallets={wallets}
              onSaveSaving={handleSaveSaving}
              onDeleteSaving={handleDeleteSaving}
              onDepositSaving={handleDepositSaving}
              onWithdrawSaving={handleWithdrawSaving}
            />
          </div>
        )}

        {/* Tab 3: Dedicated Utang-Piutang (Debt / Loan Tracker) */}
        {activeTab === 'debt' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DebtSection
              debts={debts}
              wallets={wallets}
              onSaveDebt={handleSaveDebt}
              onDeleteDebt={handleDeleteDebt}
              onPayDebt={handlePayDebt}
            />
          </div>
        )}

        {/* Tab 4: Dedicated Full Analytics Page */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AnalyticsSection transactions={transactions} />
          </div>
        )}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNavMobile
        currentTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenTransactionModal={() => handleOpenNewTransaction('expense')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        debtsCount={debts.length}
      />

      {/* PIN Lock Security Screen Modal */}
      {settings.pinLockEnabled && !isUnlocked && (
        <PinLockModal
          correctPin={settings.pinCode || '1234'}
          onSuccess={() => setIsUnlocked(true)}
          userName={settings.userName}
          userAvatar={settings.userAvatar}
        />
      )}

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxPrefillData(undefined);
        }}
        wallets={wallets}
        categories={categories}
        onSaveTransaction={handleSaveTransaction}
        defaultType={txDefaultType}
        defaultSourceWalletId={txDefaultSourceWallet}
        defaultAdminFee={settings.defaultAdminFee}
        onOpenCategoryModal={() => {
          setIsTxModalOpen(false);
          setIsCategoryModalOpen(true);
        }}
        onOpenReceiptScan={() => {
          setIsTxModalOpen(false);
          setIsReceiptScanOpen(true);
        }}
        initialPrefillData={txPrefillData}
      />

      {/* AI Receipt Scanner Modal */}
      <ReceiptScanModal
        isOpen={isReceiptScanOpen}
        onClose={() => setIsReceiptScanOpen(false)}
        categories={categories}
        wallets={wallets}
        onApplyScan={handleApplyReceiptScan}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setWalletToEdit(null);
        }}
        onSaveWallet={handleSaveWallet}
        walletToEdit={walletToEdit}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        transactions={transactions}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetCategories={handleResetCategories}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        wallets={wallets}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        savings={savings}
        debts={debts}
        onResetData={handleResetData}
        onRestoreDebts={(restoredDebts) => setDebts(restoredDebts)}
        onLoadDemoData={handleLoadDemoData}
        onOpenCategoryModal={() => {
          setIsSettingsOpen(false);
          setIsCategoryModalOpen(true);
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setIsSettingsOpen(false);
          setIsAuthModalOpen(true);
        }}
        onManualCloudSync={handleManualSync}
        isCloudSyncing={isCloudSyncing}
        lastSyncedTime={lastSyncedTime}
      />

      {/* Google / Email Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || (!isAuthChecking && !currentUser && !isGuestMode)}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        isGuestMode={isGuestMode}
        onContinueAsGuest={handleContinueAsGuest}
        canDismiss={!!currentUser || isGuestMode}
      />
    </div>
  );
}
