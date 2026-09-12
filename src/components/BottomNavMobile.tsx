import React from 'react';
import { Home, PieChart, Plus, Zap, Settings } from 'lucide-react';

interface BottomNavMobileProps {
  currentTab: 'home' | 'analytics' | 'wallets';
  onChangeTab: (tab: 'home' | 'analytics' | 'wallets') => void;
  onOpenTransactionModal: () => void;
  onOpenAutoDetect: () => void;
  onOpenSettings: () => void;
}

export const BottomNavMobile: React.FC<BottomNavMobileProps> = ({
  currentTab,
  onChangeTab,
  onOpenTransactionModal,
  onOpenAutoDetect,
  onOpenSettings,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/90 px-3 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Home */}
        <button
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            currentTab === 'home' ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Ringkasan</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => onChangeTab('analytics')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
            currentTab === 'analytics' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">Analitik</span>
        </button>

        {/* Center Floating Plus Button */}
        <div className="relative -top-5">
          <button
            onClick={onOpenTransactionModal}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border-2 border-slate-900 active:scale-95 transition-all"
            aria-label="Tambah Transaksi"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Auto Detect Mutasi */}
        <button
          onClick={onOpenAutoDetect}
          className="flex flex-col items-center gap-1 p-1.5 text-amber-400/90 hover:text-amber-300 transition-colors"
        >
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-[10px]">Auto Deteksi</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Pengaturan</span>
        </button>
      </div>
    </div>
  );
};

