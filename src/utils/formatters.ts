/**
 * Currency and Date formatters for Indonesian locale
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortRupiah(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1_000_000_000) {
    return `${sign}Rp ${(absAmount / 1_000_000_000).toFixed(1)} M`;
  }
  if (absAmount >= 1_000_000) {
    return `${sign}Rp ${(absAmount / 1_000_000).toFixed(1)} jt`;
  }
  if (absAmount >= 1_000) {
    return `${sign}Rp ${(absAmount / 1_000).toFixed(0)} rb`;
  }
  return `${sign}Rp ${absAmount}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseNumberInput(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  return clean === '' ? 0 : parseInt(clean, 10);
}
