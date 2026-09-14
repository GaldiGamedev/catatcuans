import Swal from 'sweetalert2';
import { soundFx } from './audio';

// Base customized SweetAlert2 instance
export const AppSwal = Swal.mixin({
  customClass: {
    popup: 'mucuan-swal',
    confirmButton: 'swal2-confirm',
    cancelButton: 'swal2-cancel',
    denyButton: 'swal2-deny',
  },
  buttonsStyling: false,
  background: '#0f172a',
  color: '#f8fafc',
});

// Quick toast notification in corner
export const showToast = (
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    icon,
    title,
    background: '#1e293b',
    color: '#f8fafc',
    customClass: {
      popup: 'mucuan-swal !py-3 !px-4 !rounded-xl !border !border-slate-700 !shadow-2xl',
      title: '!text-sm !font-medium !text-slate-100',
    },
  });
};

// Success modal
export const showSuccessAlert = (title: string, text?: string) => {
  soundFx.playCashRegister();
  return AppSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'Sip, Mantap!',
    iconColor: '#10b981',
  });
};

// Error modal
export const showErrorAlert = (title: string, text?: string) => {
  soundFx.playCancelOrDelete();
  return AppSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Tutup',
    iconColor: '#ef4444',
  });
};

// Warning / Confirmation modal (returns boolean)
export const showConfirmDialog = async (
  title: string,
  text: string,
  confirmButtonText = 'Ya, Lanjutkan',
  isDestructive = false
): Promise<boolean> => {
  const result = await AppSwal.fire({
    icon: isDestructive ? 'warning' : 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
    iconColor: isDestructive ? '#f59e0b' : '#6366f1',
  });

  if (result.isConfirmed) {
    if (isDestructive) {
      soundFx.playCancelOrDelete();
    } else {
      soundFx.playPop();
    }
  } else {
    soundFx.playCancelOrDelete();
  }

  return result.isConfirmed;
};

// Wallet Balance Warning confirm dialog
export const showInsufficientBalanceWarning = async (
  walletName: string,
  currentBalanceFormatted: string,
  requiredAmountFormatted: string
): Promise<boolean> => {
  const result = await AppSwal.fire({
    icon: 'warning',
    title: 'Saldo Tidak Mencukupi!',
    html: `
      <div class="text-left text-sm space-y-2 mt-2">
        <p class="text-slate-300">Saldo di <strong>${walletName}</strong> saat ini:</p>
        <p class="text-amber-400 font-bold text-lg">${currentBalanceFormatted}</p>
        <p class="text-slate-300">Dibutuhkan: <span class="text-rose-400 font-semibold">${requiredAmountFormatted}</span></p>
        <p class="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-700/60">
          Apakah Anda tetap ingin melanjutkan transaksi ini (saldo akan menjadi minus)?
        </p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Tetap Lanjutkan',
    cancelButtonText: 'Batalkan',
    iconColor: '#f59e0b',
  });

  if (result.isConfirmed) {
    soundFx.playPop();
  } else {
    soundFx.playCancelOrDelete();
  }

  return result.isConfirmed;
};
