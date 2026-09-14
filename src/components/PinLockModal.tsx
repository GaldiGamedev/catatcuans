import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface PinLockModalProps {
  correctPin: string;
  onSuccess: () => void;
  userName?: string;
  userAvatar?: string;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  correctPin,
  onSuccess,
  userName = 'Galdi',
  userAvatar = '👤',
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShake, setIsShake] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pinInput.length >= 6) return;
    soundFx.playPop(1.1);
    const newPin = pinInput + num;
    setPinInput(newPin);
    setErrorMsg('');

    // Check when length reaches target (if 4-digit or 6-digit)
    if (newPin.length === correctPin.length) {
      if (newPin === correctPin) {
        soundFx.playCashRegister();
        onSuccess();
      } else {
        triggerWrongPin();
      }
    }
  };

  const handleDelete = () => {
    if (pinInput.length === 0) return;
    soundFx.playCancelOrDelete();
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const triggerWrongPin = () => {
    soundFx.playCancelOrDelete();
    setErrorMsg('PIN yang dimasukkan salah!');
    setIsShake(true);
    setTimeout(() => {
      setPinInput('');
      setIsShake(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div
        className={`w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center relative transition-transform ${
          isShake ? 'animate-bounce text-rose-400' : ''
        }`}
      >
        {/* Decorative ambient ring */}
        <div className="absolute -top-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* User avatar & lock indicator */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border-2 border-emerald-500/30 flex items-center justify-center text-4xl shadow-xl shadow-emerald-950/40">
            {userAvatar}
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">CatatCuan Terkunci</h2>
        <p className="text-xs text-slate-400 mt-1">
          Masukkan kode PIN untuk membuka pembukuan <strong>{userName}</strong>
        </p>

        {/* PIN Indicators Dots */}
        <div className="flex items-center justify-center gap-3 my-6">
          {Array.from({ length: correctPin.length || 4 }).map((_, idx) => {
            const isFilled = idx < pinInput.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 scale-110 shadow-md shadow-emerald-500/40'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold mb-4 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              data-no-sound="true"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-750 active:bg-emerald-600 active:text-white border border-slate-700/60 text-lg font-bold text-slate-100 transition-all active:scale-95 shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Empty spacer or biometric hint */}
          <div className="h-14 flex items-center justify-center text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-500/40" />
          </div>

          <button
            type="button"
            data-no-sound="true"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-750 active:bg-emerald-600 active:text-white border border-slate-700/60 text-lg font-bold text-slate-100 transition-all active:scale-95 shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            data-no-sound="true"
            onClick={handleDelete}
            aria-label="Hapus Digit"
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-rose-950/40 active:bg-rose-600 text-slate-400 hover:text-rose-300 active:text-white border border-slate-700/50 flex items-center justify-center transition-all active:scale-95"
          >
            <span className="text-xs font-bold">HAPUS</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-6 flex items-center gap-1">
          <KeyRound className="w-3 h-3 text-emerald-400" />
          <span>Privasi & Keamanan Data Lokal Tersimpan Aman</span>
        </p>
      </div>
    </div>
  );
};
