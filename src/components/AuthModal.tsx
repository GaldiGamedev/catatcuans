import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  HelpCircle,
} from 'lucide-react';
import {
  signInWithGoogle,
  signInWithGoogleRedirect,
  loginWithEmail,
  registerWithEmail,
  sendResetPassword,
  logoutUser,
  firebaseConfig,
  User,
} from '../utils/firebase';
import { showToast, showSuccessAlert, showErrorAlert } from '../utils/sweetalert';
import { soundFx } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isGuestMode: boolean;
  onContinueAsGuest: () => void;
  onAuthSuccess?: (user: User) => void;
  canDismiss?: boolean; // False when forcing initial login
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isGuestMode,
  onContinueAsGuest,
  onAuthSuccess,
  canDismiss = true,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<{
    code: string;
    domain: string;
    projectId: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  // Copy Current Domain Helper
  const handleCopyDomain = async (domainToCopy: string) => {
    try {
      await navigator.clipboard.writeText(domainToCopy);
      setCopiedDomain(true);
      showToast(`Domain "${domainToCopy}" disalin!`, 'info');
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch {
      showToast('Gagal menyalin domain secara otomatis', 'error');
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setDiagnostic(null);
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

    try {
      soundFx.playPop(1.2);
      const user = await signInWithGoogle();
      soundFx.playCashRegister();
      showToast(`Selamat datang, ${user.displayName || user.email || 'Pengguna'}!`, 'success');
      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      let msg = 'Gagal masuk dengan akun Google.';
      const errorCode = err.code || '';
      const errorMsg = err.message || '';

      if (errorCode === 'auth/unauthorized-domain' || errorMsg.includes('unauthorized-domain')) {
        msg = `Domain hosting (${currentHost}) belum didaftarkan di Firebase Console.`;
        setDiagnostic({
          code: 'auth/unauthorized-domain',
          domain: currentHost,
          projectId: firebaseConfig.projectId,
        });
      } else if (errorCode === 'auth/operation-not-allowed') {
        msg = 'Metode Sign-in Google belum diaktifkan di Firebase Console.';
        setDiagnostic({
          code: 'auth/operation-not-allowed',
          domain: currentHost,
          projectId: firebaseConfig.projectId,
        });
      } else if (errorCode === 'auth/popup-blocked') {
        msg = 'Jendela popup Google diblokir peramban Anda.';
        setDiagnostic({
          code: 'auth/popup-blocked',
          domain: currentHost,
          projectId: firebaseConfig.projectId,
        });
      } else if (errorCode === 'auth/popup-closed-by-user') {
        msg = 'Proses login Google dibatalkan.';
      } else if (errorMsg) {
        msg = errorMsg;
      }

      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login with Redirect fallback (for popups blocked or webviews)
  const handleGoogleRedirect = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      soundFx.playPop(1.2);
      await signInWithGoogleRedirect();
    } catch (err: any) {
      console.error('Google Redirect Error:', err);
      setErrorMessage(err.message || 'Gagal memulai login Google Redirect.');
      setIsLoading(false);
    }
  };

  // Email Submit Handler (Login or Register)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Silakan isi email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      soundFx.playPop(1.1);
      let user: User;

      if (authMode === 'register') {
        if (password.length < 6) {
          throw new Error('Kata sandi minimal 6 karakter.');
        }
        user = await registerWithEmail(email, password, name);
        soundFx.playCashRegister();
        showToast('Akun CatatCuan berhasil didaftarkan!', 'success');
      } else {
        user = await loginWithEmail(email, password);
        soundFx.playCashRegister();
        showToast(`Selamat datang kembali, ${user.displayName || user.email}!`, 'success');
      }

      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      let msg = 'Gagal melakukan otentikasi.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email ini sudah terdaftar. Silakan pilih tab "Masuk".';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Format alamat email tidak valid.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Kata sandi terlalu singkat (minimal 6 karakter).';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Handler
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showToast('Ketik alamat email Anda di kolom email terlebih dahulu', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await sendResetPassword(email);
      showSuccessAlert(
        'Tautan Reset Terkirim',
        `Instruksi atur ulang kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk/spam email Anda.`
      );
    } catch (err: any) {
      console.error('Reset Password Error:', err);
      showErrorAlert(
        'Gagal Kirim Reset',
        err.message || 'Pastikan email yang Anda masukkan sudah terdaftar.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      soundFx.playCancelOrDelete();
      await logoutUser();
      showToast('Berhasil keluar dari akun.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Gagal keluar akun', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 my-auto overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if dismissible */}
        {canDismiss && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* If already logged in, show User Card */}
        {currentUser ? (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 border-2 border-emerald-500/40 mx-auto flex items-center justify-center text-2xl shadow-xl shadow-emerald-950/40 overflow-hidden">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-bold text-emerald-400">
                  {currentUser.displayName?.[0]?.toUpperCase() ||
                    currentUser.email?.[0]?.toUpperCase() ||
                    'U'}
                </span>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Akun Terhubung (Firebase)</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {currentUser.displayName || 'Pengguna CatatCuan'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Metode Masuk:</span>
                <span className="font-semibold text-slate-200">
                  {currentUser.providerData?.[0]?.providerId === 'google.com'
                    ? 'Google Account'
                    : 'Email & Password'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Sinkronisasi Data:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Aktif (Cloud Firestore)</span>
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                Lanjutkan ke Dashboard
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register Form */
          <div className="space-y-5">
            {/* Header branding */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-950/50 mb-3">
                <Sparkles className="w-6 h-6 text-slate-950 stroke-[2.3]" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {authMode === 'login' ? 'Masuk ke CatatCuan' : 'Daftar Akun CatatCuan'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Pencatatan keuangan aman, otomatis tersinkron ke cloud dengan akun Google atau Email
              </p>
            </div>

            {/* Error Message & Interactive Diagnosis Box */}
            {errorMessage && (
              <div className="space-y-2.5 animate-in fade-in">
                <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>

                {/* Unauthorized Domain Diagnostic Card */}
                {diagnostic?.code === 'auth/unauthorized-domain' && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Globe className="w-4 h-4" />
                      <span>Cara Mengaktifkan Login Google di Domain Ini:</span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Firebase mewajibkan domain hosting tempat aplikasi dipublish didaftarkan ke{' '}
                      <strong className="text-white">Authorized Domains</strong> agar login Google diizinkan.
                    </p>

                    {/* Current Domain Box with Copy Button */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700/80">
                      <div className="truncate text-slate-200 font-mono text-[11px] select-all">
                        {diagnostic.domain}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyDomain(diagnostic.domain)}
                        className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-semibold text-[10px] flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                      >
                        {copiedDomain ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Domain</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Step-by-step guidance */}
                    <div className="space-y-1.5 text-[11px] text-slate-400 pl-1">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <span>Klik tombol <strong>Buka Pengaturan Firebase</strong> di bawah.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <span>Di tab <strong>Settings</strong>, gulir ke bagian <strong>Authorized domains</strong> lalu klik <strong>Add domain</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <span>Tempel domain yang disalin ({diagnostic.domain}), lalu klik <strong>Save</strong>.</span>
                      </div>
                    </div>

                    {/* Direct link button */}
                    <a
                      href={`https://console.firebase.google.com/project/${diagnostic.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Pengaturan Firebase Console</span>
                    </a>

                    {/* Quick alternative button */}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage(null);
                        setDiagnostic(null);
                      }}
                      className="w-full text-center text-[11px] text-slate-400 hover:text-white underline pt-1"
                    >
                      Atau gunakan Login Email & Kata Sandi (Langsung aktif tanpa setup domain)
                    </button>
                  </div>
                )}

                {/* Operation not allowed Diagnostic */}
                {diagnostic?.code === 'auth/operation-not-allowed' && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2.5 text-xs">
                    <div className="text-amber-400 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Google Sign-In Belum Diaktifkan</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Penyedia (Provider) Google belum diaktifkan di Firebase Console untuk proyek ini.
                    </p>
                    <a
                      href={`https://console.firebase.google.com/project/${diagnostic.projectId}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Aktifkan Provider Google di Console</span>
                    </a>
                  </div>
                )}

                {/* Popup Blocked Diagnostic */}
                {diagnostic?.code === 'auth/popup-blocked' && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <p className="text-slate-300 text-[11px]">
                      Jendela popup login terhalang kebijakan browser. Anda dapat mencoba mode direct redirect:
                    </p>
                    <button
                      type="button"
                      onClick={handleGoogleRedirect}
                      disabled={isLoading}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Coba Login dengan Redirect (Tanpa Popup)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* One-Click Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {/* Google colored G SVG logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                atau via Email
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Mode Tabs: Masuk / Daftar */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  authMode === 'register'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Daftar Baru
              </button>
            </div>

            {/* Form Email / Password */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full py-2 pl-9 pr-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Alamat Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full py-2 pl-9 pr-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Kata Sandi <span className="text-rose-400">*</span>
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Lupa sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authMode === 'register' ? 'Minimal 6 karakter' : 'Kata sandi Anda'}
                    className="w-full py-2 pl-9 pr-10 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Baru'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Guest / Offline option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  soundFx.playPop();
                  onContinueAsGuest();
                  onClose();
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 hover:decoration-slate-400 transition-colors"
              >
                Lanjutkan Tanpa Akun (Mode Tamu / Offline)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
