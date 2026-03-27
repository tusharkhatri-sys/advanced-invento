import type { GSTBreakup } from '../types'

// ── Currency formatting ──────────────────────────────────────────────
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('en-IN').format(n)

// ── Date formatting ──────────────────────────────────────────────────
export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const formatDateForInput = (date?: Date): string => {
  const d = date || new Date()
  return d.toISOString().split('T')[0]
}

// ── GST calculation ──────────────────────────────────────────────────
export const calculateGST = (
  amount: number,
  gstRate: number,
  isInterState = false
): GSTBreakup => {
  const totalGST = (amount * gstRate) / 100

  if (isInterState) {
    return { igst: totalGST, cgst: 0, sgst: 0, rate: gstRate }
  }
  return {
    cgst: totalGST / 2,
    sgst: totalGST / 2,
    igst: 0,
    rate: gstRate,
  }
}

export const gstRates = [0, 5, 12, 18, 28]

// ── Bill number generation ────────────────────────────────────────────
export const generateBillNo = (): string => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `INV-${y}${m}${d}-${rand}`
}

// ── Profit calculation ────────────────────────────────────────────────
export const calculateProfit = (buyPrice: number, sellPrice: number, qty: number): number => {
  return (sellPrice - buyPrice) * qty
}

// ── Stock status ──────────────────────────────────────────────────────
export const getStockStatus = (
  quantity: number,
  threshold: number
): 'out' | 'low' | 'ok' => {
  if (quantity === 0) return 'out'
  if (quantity <= threshold) return 'low'
  return 'ok'
}

// ── Category helpers ──────────────────────────────────────────────────
export const categoryLabels: Record<string, string> = {
  charger: 'Charger',
  case: 'Mobile Case',
  earphone: 'Earphone',
  screen_guard: 'Screen Guard',
  cable: 'Cable',
  powerbank: 'Power Bank',
  other: 'Other',
}

export const categoryColors: Record<string, string> = {
  charger: 'badge-blue',
  case: 'badge-purple',
  earphone: 'badge-green',
  screen_guard: 'badge-yellow',
  cable: 'badge-blue',
  powerbank: 'badge-red',
  other: 'badge-yellow',
}

// ── WhatsApp share ────────────────────────────────────────────────────
export const shareOnWhatsApp = (message: string, phone?: string): void => {
  const encoded = encodeURIComponent(message)
  const url = phone
    ? `https://wa.me/91${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
  window.open(url, '_blank')
}

// ── Truncate text ─────────────────────────────────────────────────────
export const truncate = (text: string, length = 30): string =>
  text.length > length ? text.slice(0, length) + '…' : text

// ── Debounce ──────────────────────────────────────────────────────────
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
) => {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
