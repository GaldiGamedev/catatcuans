import React from 'react';
import { Home, PieChart, Plus, Target, Settings, HandCoins } from 'lucide-react';

interface BottomNavMobileProps {
  currentTab: 'home' | 'analytics' | 'budget' | 'debt';
  onChangeTab: (tab: 'home' | 'analytics' | 'budget' | 'debt') => void;
  onOpenTransactionModal: () => void;
  onOpenSettings: () => void;
  debtsCount?: number;
}

export const BottomNavMobile: React.FC<BottomNavMobileProps> = ({
  currentTab,
  onChangeTab,
  onOpenTransactionModal,
  onOpenSettings,
  debtsCount = 0,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5">
      <div className="max-w-md mx-auto flex items-center justify-between relative px-1">
        {/* Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            currentTab === 'home' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Ringkasan</span>
        </button>

        {/* Budget & Savings */}
        <button
          onClick={() => onChangeTab('budget')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            currentTab === 'budget' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px]">Target</span>
        </button>

        {/* Center Floating Plus Button */}
        <div className="relative -top-4 px-1">
          <button
            onClick={onOpenTransactionModal}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border-2 border-slate-900 active:scale-95 transition-all"
            aria-label="Tambah Transaksi"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Utang-Piutang */}
        <button
          onClick={() => onChangeTab('debt')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors relative ${
            currentTab === 'debt' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <HandCoins className="w-5 h-5" />
            {debtsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                {debtsCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Utang</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => onChangeTab('analytics')}
          className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
            currentTab === 'analytics' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">Analitik</span>
        </button>
      </div>
    </div>
  );
};
