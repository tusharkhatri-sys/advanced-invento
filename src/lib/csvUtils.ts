import { supabase } from '../lib/supabase'
import type { Product } from '../types'
import toast from 'react-hot-toast'

// ============ CSV EXPORT ============

export const exportProductsCSV = async () => {
  const { data, error } = await supabase.from('products').select('*').order('name')
  if (error) { toast.error(error.message); return }
  if (!data?.length) { toast.error('No products to export'); return }

  const headers = ['Name', 'Category', 'Barcode', 'Buy Price', 'Sell Price', 'Quantity', 'Low Stock At', 'GST Rate', 'HSN Code']
  const rows = data.map((p: any) => [
    `"${p.name}"`, p.category, p.barcode || '', p.buy_price, p.sell_price,
    p.quantity, p.low_stock_threshold, p.gst_rate, p.hsn_code || ''
  ])

  downloadCSV('Products', headers, rows)
  toast.success(`Exported ${data.length} products!`)
}

export const exportSalesCSV = async (from?: string, to?: string) => {
  let query = supabase.from('sales').select('*').order('date', { ascending: false })
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) { toast.error(error.message); return }
  if (!data?.length) { toast.error('No sales to export'); return }

  const headers = ['Date', 'Bill No', 'Customer', 'Phone', 'Subtotal', 'GST', 'Discount', 'Total', 'Payment', 'Items Count']
  const rows = data.map((s: any) => {
    const items = typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || [])
    return [
      s.date, s.bill_no, `"${s.customer_name || ''}"`, s.phone || '',
      s.subtotal, s.gst_amount, s.discount, s.total,
      s.payment_method, items.length
    ]
  })

  downloadCSV('Sales', headers, rows)
  toast.success(`Exported ${data.length} sales!`)
}

export const exportExpensesCSV = async (from?: string, to?: string) => {
  let query = supabase.from('expenses').select('*').order('date', { ascending: false })
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) { toast.error(error.message); return }
  if (!data?.length) { toast.error('No expenses to export'); return }

  const headers = ['Date', 'Category', 'Amount', 'Description', 'Payment Method']
  const rows = data.map((e: any) => [e.date, e.category, e.amount, `"${e.description || ''}"`, e.payment_method])

  downloadCSV('Expenses', headers, rows)
  toast.success(`Exported ${data.length} expenses!`)
}

function downloadCSV(name: string, headers: string[], rows: any[][]) {
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ============ CSV IMPORT ============

export const importProductsCSV = async (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter((l) => l.trim())
        if (lines.length < 2) { reject(new Error('Empty CSV')); return }

        // Skip header row
        const products = lines.slice(1).map((line) => {
          const cols = parseCSVLine(line)
          return {
            name: cols[0]?.replace(/"/g, '').trim(),
            category: cols[1]?.trim() || 'other',
            barcode: cols[2]?.trim() || undefined,
            buy_price: Number(cols[3]) || 0,
            sell_price: Number(cols[4]) || 0,
            quantity: Number(cols[5]) || 0,
            low_stock_threshold: Number(cols[6]) || 5,
            gst_rate: Number(cols[7]) || 18,
            hsn_code: cols[8]?.trim() || undefined,
          }
        }).filter((p) => p.name)

        if (!products.length) { reject(new Error('No valid products found')); return }

        const { error } = await supabase.from('products').insert(products)
        if (error) { reject(error); return }

        resolve(products.length)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes }
    else if (char === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += char }
  }
  result.push(current)
  return result
}

// ============ WHATSAPP STOCK ALERT ============

export const generateWhatsAppStockAlert = (lowStockProducts: Array<{ name: string; quantity: number }>) => {
  if (!lowStockProducts.length) { toast.error('No low stock items'); return }

  const msg = `📦 *Low Stock Alert — Reorder Needed*\n\n${lowStockProducts.map((p, i) => `${i + 1}. ${p.name} — Only ${p.quantity} left`).join('\n')}\n\n_Please send these items ASAP._\nThank you! 🙏`
  const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}
