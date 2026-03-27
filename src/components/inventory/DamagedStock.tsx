import { useState } from 'react'
import { Plus, Trash2, PackageSearch, AlertTriangle, AlertCircle } from 'lucide-react'
import { useDamagedStock, useCreateDamagedStock, useDeleteDamagedStock } from '../../hooks/useDamagedStock'
import { useProducts } from '../../hooks/useProducts'
import Modal, { ConfirmModal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function DamagedStock() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<{ id: string, product_id: string, qty: number } | null>(null)
  
  const { data: records, isLoading } = useDamagedStock()
  const { data: products } = useProducts()
  const createRecord = useCreateDamagedStock()
  const deleteRecord = useDeleteDamagedStock()

  const [form, setForm] = useState({
    product_id: '',
    qty: '',
    reason: 'physical_damage',
    notes: ''
  })

  // Calculations
  const totalLoss = records?.reduce((sum, r) => sum + ((r.qty || 0) * (r.buy_price || 0)), 0) || 0
  const totalItems = records?.reduce((sum, r) => sum + (r.qty || 0), 0) || 0

  const selectedProduct = products?.find(p => p.id === form.product_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    await createRecord.mutateAsync({
      product_id: form.product_id,
      qty: Number(form.qty),
      reason: form.reason,
      notes: form.notes,
      buy_price: selectedProduct.buy_price,
      date: new Date().toISOString()
    })
    setIsModalOpen(false)
    setForm({ product_id: '', qty: '', reason: 'physical_damage', notes: '' })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100">Dead / Damaged Stock</h2>
            <p className="text-xs text-gray-500">Track items that cannot be sold or returned</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary bg-red-600 hover:bg-red-500 w-full sm:w-auto">
          <Plus size={18} /> Report Damage
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card border border-red-900/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-xs text-gray-400">Total Net Loss</p>
          </div>
          <p className="text-xl font-bold text-red-500">{formatCurrency(totalLoss)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-1">
            <PackageSearch size={14} className="text-gray-400" />
            <p className="text-xs text-gray-400">Total Damaged Items</p>
          </div>
          <p className="text-xl font-bold text-gray-200">{totalItems} Units</p>
        </div>
      </div>

      {/* List */}
      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner /></div>
        ) : !records?.length ? (
          <div className="text-center p-12">
            <AlertTriangle size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No damaged stock reported!</p>
            <p className="text-gray-600 text-xs mt-1">Your inventory is safe.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-gray-500 bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium text-right">Qty</th>
                <th className="p-4 font-medium text-right">Loss Amount</th>
                <th className="p-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="p-4 text-gray-400 text-xs">{formatDate(r.date)}</td>
                  <td className="p-4">
                    <p className="font-medium text-gray-200">{r.product?.name || 'Unknown Product'}</p>
                    {r.notes && <p className="text-[10px] text-gray-500 mt-1 max-w-xs truncate">{r.notes}</p>}
                  </td>
                  <td className="p-4">
                    <span className="badge badge-gray text-xs capitalize">{r.reason.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-red-400 font-bold">-{r.qty}</span>
                  </td>
                  <td className="p-4 text-right font-medium text-gray-300">
                    {formatCurrency(r.qty * r.buy_price)}
                    <p className="text-[10px] text-gray-600">@ {formatCurrency(r.buy_price)} ea</p>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setDeleteId({ id: r.id, product_id: r.product_id, qty: r.qty })} 
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Undo & Restore to Inventory"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="🗑️ Report Damaged Stock">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-start gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200">
              Reporting damaged stock will <strong>permanently deduct</strong> it from your main inventory. Use this only for items that cannot be sold or returned to the company.
            </p>
          </div>

          <div>
            <label className="label">Select Product *</label>
            <select 
              required className="input" 
              value={form.product_id} 
              onChange={e => setForm({...form, product_id: e.target.value})}
            >
              <option value="">Select an item...</option>
              {products?.map(p => (
                <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                  {p.name} (Stock: {p.quantity}) - {formatCurrency(p.buy_price)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity Damaged *</label>
              <input 
                type="number" required min="1" 
                max={selectedProduct?.quantity || 1} 
                className="input" 
                value={form.qty} 
                onChange={e => setForm({...form, qty: e.target.value})} 
                placeholder="0"
              />
              {selectedProduct && (
                <p className="text-[10px] text-gray-500 mt-1">Max available: {selectedProduct.quantity}</p>
              )}
            </div>
            <div>
              <label className="label">Reason *</label>
              <select 
                required className="input" 
                value={form.reason} 
                onChange={e => setForm({...form, reason: e.target.value})}
              >
                <option value="physical_damage">Physical Damage (Broken)</option>
                <option value="manufacturing_defect">Manufacturing Defect (Dead)</option>
                <option value="expired">Expired / Old Model</option>
                <option value="lost_stolen">Lost / Stolen</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes / Description</label>
            <input 
              type="text" className="input" 
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})} 
              placeholder="e.g. Broken display during transit"
            />
          </div>

          {selectedProduct && form.qty && (
            <div className="bg-gray-900 rounded-lg p-3 py-2 flex justify-between items-center mt-2 border border-gray-800">
              <span className="text-sm text-gray-400">Total Valuation Loss:</span>
              <span className="text-lg font-bold text-red-400">
                {formatCurrency(Number(form.qty) * selectedProduct.buy_price)}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary bg-red-600 hover:bg-red-500 flex-1" disabled={createRecord.isPending || !form.product_id}>
              {createRecord.isPending ? 'Logging...' : 'Confirm Damage'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await deleteRecord.mutateAsync(deleteId)
            setDeleteId(null)
          }
        }}
        title="Undo Damage Record"
        message={`Are you sure? This will remove the damage report and restore ${deleteId?.qty} items back to your main inventory.`}
      />
    </div>
  )
}
