import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { WalletsSection } from './components/WalletsSection';
import { TransactionList } from './components/TransactionList';
import { AnalyticsSection } from './components/AnalyticsSection';
import { TransactionModal } from './components/TransactionModal';
import { WalletModal } from './components/WalletModal';
import { CategoryModal } from './components/CategoryModal';
import { BottomNavMobile } from './components/BottomNavMobile';
import { AutoDetectModal } from './components/AutoDetectModal';
import { SettingsModal } from './components/SettingsModal';
import { Wallet, Transaction, Category, TransactionType, AppSettings } from './types';
import {
  getStoredWallets,
  saveStoredWallets,
  getStoredTransactions,
  saveStoredTransactions,
  getStoredCategories,
  saveStoredCategories,
  getStoredSettings,
  saveStoredSettings,
  calculateWalletBalances,
} from './utils/storage';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  // Primary State
  const [rawWallets, setRawWallets] = useState<Wallet[]>(() => getStoredWallets());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());

  // Navigation & Filtering
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'home' | 'analytics' | 'wallets'>('home');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txDefaultType, setTxDefaultType] = useState<TransactionType>('expense');
  const [txDefaultSourceWallet, setTxDefaultSourceWallet] = useState<string | undefined>(undefined);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAutoDetectOpen, setIsAutoDetectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync to LocalStorage whenever state changes
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
  }, [settings]);

  // Compute real-time balances for all wallets based on transactions
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
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
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

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
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

  const handleOpenTransferModalWithSource = (walletId: string) => {
    setTxDefaultType('transfer');
    setTxDefaultSourceWallet(walletId);
    setIsTxModalOpen(true);
  };

  const handleOpenNewTransaction = (type: TransactionType = 'expense') => {
    setTxDefaultType(type);
    setTxDefaultSourceWallet(selectedWalletId || undefined);
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-10">
      {/* Background ambient light - optimized without continuous heavy animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Main Header */}
      <Header
        onOpenTransactionModal={() => handleOpenNewTransaction('expense')}
        onOpenWalletModal={() => handleOpenWalletModal()}
        onOpenAutoDetect={() => setIsAutoDetectOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        wallets={wallets}
        transactions={transactions}
        categories={categories}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        {/* Mobile Tab: Analytics Only */}
        {mobileTab === 'analytics' && (
          <div className="md:hidden">
            <AnalyticsSection transactions={transactions} />
          </div>
        )}

        {/* Mobile Tab: Wallets Only */}
        {mobileTab === 'wallets' && (
          <div className="md:hidden">
            <WalletsSection
              wallets={wallets}
              selectedWalletId={selectedWalletId}
              onSelectWallet={setSelectedWalletId}
              onOpenWalletModal={handleOpenWalletModal}
              onOpenTransferModalWithSource={handleOpenTransferModalWithSource}
              onDeleteWallet={handleDeleteWallet}
              privacyMode={settings.privacyMode}
            />
          </div>
        )}

        {/* Default View (Desktop always shows full dashboard; Mobile shows when on 'home') */}
        <div className={mobileTab !== 'home' ? 'hidden md:block' : 'block'}>
          {/* Quick Smart Notification Banner */}
          <div className="mb-4 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Fitur Deteksi Notifikasi Transfer & Mutasi Aktif
                </p>
                <p className="text-[11px] text-slate-400">
                  Salin pesan SMS banking, receipt e-wallet, atau notifikasi transfer dan tempel untuk otomatis tercatat.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAutoDetectOpen(true)}
              className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Coba Deteksi Mutasi</span>
            </button>
          </div>

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

          {/* Main Grid: Left Transactions List, Right Analytics & Quick Actions */}
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
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNavMobile
        currentTab={mobileTab}
        onChangeTab={setMobileTab}
        onOpenTransactionModal={() => handleOpenNewTransaction('expense')}
        onOpenAutoDetect={() => setIsAutoDetectOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
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
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Auto Detect Notification Modal */}
      <AutoDetectModal
        isOpen={isAutoDetectOpen}
        onClose={() => setIsAutoDetectOpen(false)}
        wallets={wallets}
        categories={categories}
        onSaveTransaction={handleSaveTransaction}
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
        onResetData={handleResetData}
        onOpenAutoDetect={() => setIsAutoDetectOpen(true)}
      />
    </div>
  );
}
