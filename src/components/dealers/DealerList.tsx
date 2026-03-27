import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, UserCheck, Phone, MapPin, MessageCircle } from 'lucide-react'
import { useDealers, useCreateDealer, useUpdateDealer, useDeleteDealer } from '../../hooks/useDealers'
import type { Dealer } from '../../hooks/useDealers'
import { formatCurrency } from '../../lib/utils'
import Modal from '../ui/Modal'
import { ConfirmModal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'

const priceTierLabels: Record<string, string> = {
  retail: '🏪 Retail',
  wholesale: '📦 Wholesale',
  super_wholesale: '🚛 Super Wholesale',
}

const blankForm = {
  name: '', business_name: '', phone: '', address: '',
  gstin: '', credit_limit: 0, price_tier: 'wholesale' as 'retail' | 'wholesale' | 'super_wholesale', notes: '',
}

export default function DealerList() {
  const [search, setSearch] = useState('')
  const { data: dealers, isLoading } = useDealers(search || undefined)
  const createDealer = useCreateDealer()
  const updateDealer = useUpdateDealer()
  const deleteDealer = useDeleteDealer()

  const [showForm, setShowForm] = useState(false)
  const [editDealer, setEditDealer] = useState<Dealer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(blankForm)

  const openEdit = (d: Dealer) => {
    setEditDealer(d)
    setForm({
      name: d.name, business_name: d.business_name || '', phone: d.phone,
      address: d.address || '', gstin: d.gstin || '',
      credit_limit: d.credit_limit, price_tier: d.price_tier, notes: d.notes || '',
    })
    setShowForm(true)
  }

  const handleClose = () => { setShowForm(false); setEditDealer(null); setForm(blankForm) }
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, credit_limit: Number(form.credit_limit), outstanding_balance: 0 }
    if (editDealer) {
      await updateDealer.mutateAsync({ id: editDealer.id, ...payload })
    } else {
      await createDealer.mutateAsync(payload)
    }
    handleClose()
  }

  const totalOutstanding = (dealers || []).reduce((s, d) => s + d.outstanding_balance, 0)

  const sendWhatsAppReminder = (name: string, phone: string, amount: number) => {
    const msg = `🙏 Namaste ${name} ji,\n\nYeh ek friendly reminder hai ki aapka ₹${amount.toFixed(0)} ka balance baaki hai.\n\nKripya jaldi se jaldi payment kar dein.\n\nDhanyavaad! 🙏`
    const phoneNum = phone.length === 10 ? `91${phone}` : phone.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-gray-400">Total Dealers</p>
          <p className="text-lg font-bold text-brand-400">{dealers?.length || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400">Total Outstanding</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="stat-card hidden sm:block">
          <p className="text-xs text-gray-400">Wholesale</p>
          <p className="text-lg font-bold text-emerald-400">{(dealers || []).filter(d => d.price_tier === 'wholesale').length}</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Search dealers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Add Dealer
        </button>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !dealers?.length ? (
          <div className="text-center py-12">
            <UserCheck size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No dealers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {dealers.map((d) => (
              <div key={d.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-200">{d.name}</p>
                      <span className="badge badge-blue text-xs">{priceTierLabels[d.price_tier]}</span>
                    </div>
                    {d.business_name && <p className="text-xs text-brand-400">{d.business_name}</p>}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Phone size={10} /> {d.phone}</span>
                      {d.address && <span className="flex items-center gap-1"><MapPin size={10} /> {d.address}</span>}
                    </div>
                    {d.gstin && <p className="text-xs text-gray-600 font-mono mt-0.5">GSTIN: {d.gstin}</p>}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-brand-400"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                    {d.outstanding_balance > 0 && (
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-xs text-red-400 font-medium">Baaki: {formatCurrency(d.outstanding_balance)}</p>
                        <button 
                          onClick={() => sendWhatsAppReminder(d.name, d.phone, d.outstanding_balance)}
                          className="flex items-center gap-1 text-[10px] font-medium text-green-400 bg-green-400/10 hover:bg-green-400/20 px-2 py-1 rounded transition-colors mt-1"
                        >
                          <MessageCircle size={10} /> WhatsApp
                        </button>
                      </div>
                    )}
                    {d.credit_limit > 0 && (
                      <p className="text-xs text-gray-600">Limit: {formatCurrency(d.credit_limit)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={handleClose} title={editDealer ? '✏️ Edit Dealer' : '➕ Add Dealer'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Party/Dealer Name *</label>
              <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ramesh Ji" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Business Name</label>
              <input className="input" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="e.g. Ramesh Mobile Accessories" />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Mobile number" />
            </div>
            <div>
              <label className="label">Price Tier</label>
              <select className="input" value={form.price_tier} onChange={(e) => set('price_tier', e.target.value)}>
                <option value="retail">🏪 Retail</option>
                <option value="wholesale">📦 Wholesale</option>
                <option value="super_wholesale">🚛 Super Wholesale (Lowest Rate)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="City, State" />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input className="input font-mono uppercase" maxLength={15} value={form.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} placeholder="GST number" />
            </div>
            <div>
              <label className="label">Credit Limit (₹)</label>
              <input type="number" min="0" className="input" value={form.credit_limit} onChange={(e) => set('credit_limit', e.target.value)} placeholder="Max udhar allowed" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createDealer.isPending || updateDealer.isPending} className="btn btn-primary flex-1">
              {createDealer.isPending || updateDealer.isPending ? 'Saving...' : editDealer ? 'Update' : 'Add Dealer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await deleteDealer.mutateAsync(deleteId!); setDeleteId(null) }} message="Delete this dealer?" loading={deleteDealer.isPending} />
    </div>
  )
}
