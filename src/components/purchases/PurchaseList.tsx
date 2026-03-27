import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { usePurchases, useCreatePurchase } from '../../hooks/usePurchases'
import { useProducts } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'
import { formatCurrency, formatDate } from '../../lib/utils'
import Modal from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function PurchaseList() {
  const { data: purchases, isLoading } = usePurchases()
  const { data: products } = useProducts()
  const { data: suppliers } = useSuppliers()
  const createPurchase = useCreatePurchase()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    product_id: '',
    supplier_id: '',
    qty: 1,
    rate: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createPurchase.mutateAsync({
      product_id: form.product_id,
      supplier_id: form.supplier_id || undefined,
      qty: Number(form.qty),
      rate: Number(form.rate),
      total: Number(form.qty) * Number(form.rate),
      date: form.date,
      notes: form.notes || undefined,
    })
    setShowForm(false)
    setForm({ product_id: '', supplier_id: '', qty: 1, rate: 0, date: new Date().toISOString().split('T')[0], notes: '' })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{purchases?.length || 0} purchase records</p>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Add Purchase
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !purchases?.length ? (
          <div className="text-center py-12">
            <Truck size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No purchases yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Product</th>
                  <th className="table-header hidden sm:table-cell">Supplier</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Rate</th>
                  <th className="table-header">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell text-xs text-gray-500">{formatDate(p.date)}</td>
                    <td className="table-cell">
                      <p className="text-sm text-gray-200">
                        {(p.product as { name?: string })?.name || p.product_id}
                      </p>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-xs text-gray-500">
                      {(p.supplier as { name?: string })?.name || '—'}
                    </td>
                    <td className="table-cell text-center">{p.qty}</td>
                    <td className="table-cell text-xs">{formatCurrency(p.rate)}</td>
                    <td className="table-cell font-medium text-brand-400">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Purchase Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="🚚 Add Purchase Entry" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Product *</label>
            <select className="input" required value={form.product_id} onChange={(e) => set('product_id', e.target.value)}>
              <option value="">Select product</option>
              {(products || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Supplier</label>
            <select className="input" value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)}>
              <option value="">Select supplier (optional)</option>
              {(suppliers || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" className="input" required value={form.qty} onChange={(e) => set('qty', e.target.value)} />
            </div>
            <div>
              <label className="label">Buy Rate (₹) *</label>
              <input type="number" min="0" step="0.01" className="input" required value={form.rate} onChange={(e) => set('rate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" placeholder="Optional" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {form.qty > 0 && form.rate > 0 && (
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <p className="text-sm text-brand-400 font-medium">
                Total: {formatCurrency(Number(form.qty) * Number(form.rate))}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createPurchase.isPending} className="btn btn-primary flex-1">
              {createPurchase.isPending ? 'Saving...' : 'Add Purchase'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
