import { useState } from 'react'
import { RotateCcw, Search, AlertTriangle, RefreshCw, XCircle, Package } from 'lucide-react'
import { useSales, useReturnSale } from '../../hooks/useSales'
import { useUpdateStock } from '../../hooks/useProducts'
import { formatCurrency, formatDate, formatDateForInput } from '../../lib/utils'
import Modal from '../ui/Modal'
import { ConfirmModal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'

type ReturnReason = 'defective' | 'warranty' | 'not_liked' | 'wrong_item' | 'other'

const reasonLabels: Record<ReturnReason, { label: string; icon: string; color: string }> = {
  defective: { label: 'Kharaab / Defective', icon: '⚠️', color: 'text-red-400' },
  warranty: { label: 'Warranty Return', icon: '🛡️', color: 'text-amber-400' },
  not_liked: { label: 'Pasand Nahi Aaya', icon: '👎', color: 'text-blue-400' },
  wrong_item: { label: 'Galat Item Diya', icon: '🔄', color: 'text-purple-400' },
  other: { label: 'Other', icon: '📋', color: 'text-gray-400' },
}

export default function ReturnsPage() {
  const [searchBill, setSearchBill] = useState('')
  const [from, setFrom] = useState(formatDateForInput(new Date(Date.now() - 30 * 86400000)))
  const [to, setTo] = useState(formatDateForInput())
  const [showReturn, setShowReturn] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [returnItems, setReturnItems] = useState<Record<string, { qty: number; checked: boolean }>>({})
  const [reason, setReason] = useState<ReturnReason>('defective')
  const [notes, setNotes] = useState('')
  const [returnType, setReturnType] = useState<'refund' | 'exchange'>('refund')
  const [confirmReturn, setConfirmReturn] = useState(false)

  const { data: sales, isLoading } = useSales({ from, to })
  const returnSale = useReturnSale()
  const updateStock = useUpdateStock()

  // Filter: only non-returned sales, matching search
  const filtered = (sales || []).filter((s) => {
    if (s.returned) return false
    if (!searchBill) return true
    const q = searchBill.toLowerCase()
    return s.bill_no?.toLowerCase().includes(q) ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
  })

  const openReturnModal = (sale: any) => {
    setSelectedSale(sale)
    const items: Record<string, { qty: number; checked: boolean }> = {}
    const saleItems = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
    saleItems.forEach((item: any) => {
      items[item.product_id] = { qty: item.qty, checked: true }
    })
    setReturnItems(items)
    setShowReturn(true)
    setReason('defective')
    setNotes('')
    setReturnType('refund')
  }

  const toggleItem = (pid: string) => {
    setReturnItems((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], checked: !prev[pid].checked },
    }))
  }

  const setReturnQty = (pid: string, qty: number) => {
    setReturnItems((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], qty: Math.max(0, qty) },
    }))
  }

  const handleReturn = async () => {
    if (!selectedSale) return
    const saleItems = typeof selectedSale.items === 'string' ? JSON.parse(selectedSale.items) : selectedSale.items
    const selectedItems = saleItems.filter((item: any) => returnItems[item.product_id]?.checked)

    if (!selectedItems.length) { toast.error('Koi item select karo'); return }

    try {
      // Check if ALL items are being returned (full return)
      const allReturned = selectedItems.length === saleItems.length &&
        selectedItems.every((item: any) => returnItems[item.product_id]?.qty === item.qty)

      if (allReturned) {
        // Full return — use existing hook
        await returnSale.mutateAsync(selectedSale.id)
      } else {
        // Partial return — restore stock for selected items only
        for (const item of selectedItems) {
          const returnQty = returnItems[item.product_id]?.qty || 0
          if (returnQty > 0) {
            // Get current stock and add back
            const { data: product } = await supabase
              .from('products')
              .select('quantity')
              .eq('id', item.product_id)
              .single()

            if (product) {
              await updateStock.mutateAsync({
                id: item.product_id,
                qty: product.quantity + returnQty,
              })
            }
          }
        }
        toast.success(`${selectedItems.length} item(s) return processed! Stock restored.`)
      }

      setShowReturn(false)
      setSelectedSale(null)
    } catch (err: any) {
      toast.error(err.message || 'Return failed')
    }
  }

  const saleItems = selectedSale
    ? (typeof selectedSale.items === 'string' ? JSON.parse(selectedSale.items) : selectedSale.items)
    : []

  const returnTotal = saleItems
    .filter((item: any) => returnItems[item.product_id]?.checked)
    .reduce((sum: number, item: any) => {
      const qty = returnItems[item.product_id]?.qty || 0
      return sum + (item.sell_price * qty)
    }, 0)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
          <RotateCcw size={20} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-100">Returns & Exchange</h2>
          <p className="text-xs text-gray-500">Defective, warranty, customer return</p>
        </div>
      </div>

      {/* Search + Date filter */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label">Search Bill / Customer</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="input pl-9" placeholder="Bill no, name, or phone..." value={searchBill} onChange={(e) => setSearchBill(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {/* Sales list */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !filtered.length ? (
          <div className="text-center py-12">
            <Package size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No bills found</p>
            <p className="text-xs text-gray-600">Search by bill number, customer name or phone</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.slice(0, 50).map((sale) => {
              const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
              return (
                <div key={sale.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-200">#{sale.bill_no}</p>
                        <span className="text-xs text-gray-600">{formatDate(sale.date)}</span>
                      </div>
                      {sale.customer_name && (
                        <p className="text-xs text-gray-400">{sale.customer_name} {sale.phone ? `• ${sale.phone}` : ''}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {items.length} items: {items.map((i: any) => `${i.product_name} ×${i.qty}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-200">{formatCurrency(sale.total)}</p>
                      <button
                        onClick={() => openReturnModal(sale)}
                        className="btn btn-sm mt-1 text-xs text-red-400 border-red-600/30 hover:bg-red-500/10"
                      >
                        <RotateCcw size={12} /> Return
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Return Modal */}
      {showReturn && selectedSale && (
        <Modal isOpen onClose={() => setShowReturn(false)} title="🔄 Process Return / Exchange" size="lg">
          <div className="space-y-4 max-h-[70vh] overflow-auto">
            {/* Bill info */}
            <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700">
              <p className="text-sm font-medium text-gray-200">Bill #{selectedSale.bill_no}</p>
              <p className="text-xs text-gray-500">
                {selectedSale.customer_name || 'Walk-in'} • {formatDate(selectedSale.date)} • {formatCurrency(selectedSale.total)}
              </p>
            </div>

            {/* Return Reason */}
            <div>
              <label className="label">Return Reason / Wajah</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(reasonLabels) as ReturnReason[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`p-2 rounded-xl text-xs font-medium border transition-all text-left
                      ${reason === r
                        ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                  >
                    {reasonLabels[r].icon} {reasonLabels[r].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Return Type */}
            <div>
              <label className="label">Action</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReturnType('refund')}
                  className={`flex-1 p-3 rounded-xl text-sm font-medium border transition-all
                    ${returnType === 'refund'
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                  💰 Refund (Paisa Wapas)
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('exchange')}
                  className={`flex-1 p-3 rounded-xl text-sm font-medium border transition-all
                    ${returnType === 'exchange'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                  🔄 Exchange (Badal Do)
                </button>
              </div>
            </div>

            {/* Select items */}
            <div>
              <label className="label">Select Items to Return</label>
              <div className="space-y-2">
                {saleItems.map((item: any) => (
                  <div key={item.product_id} className={`p-3 rounded-xl border transition-all ${returnItems[item.product_id]?.checked ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={returnItems[item.product_id]?.checked || false}
                        onChange={() => toggleItem(item.product_id)}
                        className="w-4 h-4 rounded accent-red-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-200">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          Sold: {item.qty} × {formatCurrency(item.sell_price)}
                        </p>
                      </div>
                      {returnItems[item.product_id]?.checked && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Return Qty:</label>
                          <input
                            type="number"
                            min={1}
                            max={item.qty}
                            value={returnItems[item.product_id]?.qty || 0}
                            onChange={(e) => setReturnQty(item.product_id, Math.min(item.qty, Number(e.target.value)))}
                            className="input w-16 text-center text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (Optional)</label>
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Screen damaged, warranty claim #123" />
            </div>

            {/* Return summary */}
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">
                  {returnType === 'refund' ? '💰 Refund Amount:' : '🔄 Exchange Value:'}
                </span>
                <span className="text-lg font-bold text-red-400">{formatCurrency(returnTotal)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reasonLabels[reason].icon} {reasonLabels[reason].label} • Stock will be restored
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setShowReturn(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => setConfirmReturn(true)}
                disabled={!Object.values(returnItems).some((i) => i.checked && i.qty > 0)}
                className="btn btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
              >
                <RotateCcw size={14} /> Process Return
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm */}
      <ConfirmModal
        isOpen={confirmReturn}
        onClose={() => setConfirmReturn(false)}
        onConfirm={async () => { await handleReturn(); setConfirmReturn(false) }}
        message={`${returnType === 'refund' ? 'Refund' : 'Exchange'} for ${formatCurrency(returnTotal)}? Stock will be restored.`}
        loading={returnSale.isPending || updateStock.isPending}
      />
    </div>
  )
}
