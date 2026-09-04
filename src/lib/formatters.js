export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
}

export function formatDate(dateStr, options) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat(
    'en-US',
    options ?? { year: 'numeric', month: 'short', day: 'numeric' },
  ).format(new Date(dateStr))
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value ?? 0)
}
