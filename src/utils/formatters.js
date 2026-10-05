/**
 * formatters.js
 * Utilitas pemformatan angka, satuan, dan penanganan nilai null/undefined
 * Sesuai kaidah standar Bahasa Indonesia (titik untuk ribuan, koma untuk desimal)
 */

export function safeValue(val, fallback = 'Data tidak tersedia') {
  if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
    return fallback;
  }
  return val;
}

export function formatNumberIndo(val, decimals = 1) {
  if (val === null || val === undefined || val === '' || Number.isNaN(Number(val))) {
    return 'Data tidak tersedia';
  }
  const num = Number(val);
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined && decimals > 0 ? `${formattedInt},${decPart}` : formattedInt;
}

export function formatHectares(val) {
  const formatted = formatNumberIndo(val, 2);
  return formatted === 'Data tidak tersedia' ? formatted : `${formatted} ha`;
}

export function formatPercent(val) {
  const formatted = formatNumberIndo(val, 1);
  return formatted === 'Data tidak tersedia' ? formatted : `${formatted}%`;
}

export function formatKm(val) {
  const formatted = formatNumberIndo(val, 1);
  return formatted === 'Data tidak tersedia' ? formatted : `${formatted} km`;
}

export function formatScore(val, max = 100) {
  const formatted = formatNumberIndo(val, 1);
  return formatted === 'Data tidak tersedia' ? formatted : `${formatted} / ${max}`;
}

export function getVulnerabilityLevel(score) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return { text: 'Tidak Teridentifikasi', color: 'slate', badgeBg: 'bg-slate-800', textColor: 'text-slate-400' };
  }
  const num = Number(score);
  if (num >= 75) {
    return { text: 'Tinggi', color: 'rose', badgeBg: 'bg-rose-500/15 border-rose-500/30', textColor: 'text-rose-400' };
  }
  if (num >= 50) {
    return { text: 'Sedang', color: 'amber', badgeBg: 'bg-amber-500/15 border-amber-500/30', textColor: 'text-amber-400' };
  }
  return { text: 'Rendah', color: 'emerald', badgeBg: 'bg-emerald-500/15 border-emerald-500/30', textColor: 'text-emerald-400' };
}
