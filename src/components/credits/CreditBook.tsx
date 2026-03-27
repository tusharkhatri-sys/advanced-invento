import { useState } from 'react'
import { Plus, IndianRupee, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useCredits, useCreateCredit, useUpdateCredit, useCreditSummary } from '../../hooks/useCredits'
import { formatCurrency, formatDate, formatDateForInput } from '../../lib/utils'
import Modal from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function CreditBook() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [paymentModal, setPaymentModal] = useState<{ id: string; name: string; remaining: number } | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const { data: credits, isLoading } = useCredits(statusFilter)
  const { data: summary } = useCreditSummary()
  const createCredit = useCreateCredit()
  const updateCredit = useUpdateCredit()

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    total_amount: '',
    notes: '',
    due_date: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCredit.mutateAsync({
      customer_name: form.customer_name,
      phone: form.phone || undefined,
      total_amount: Number(form.total_amount),
      paid_amount: 0,
      status: 'pending',
      notes: form.notes || undefined,
      due_date: form.due_date || undefined,
    })
    setShowForm(false)
    setForm({ customer_name: '', phone: '', total_amount: '', notes: '', due_date: '' })
  }

  const handlePayment = async () => {
    if (!paymentModal || !paymentAmount) return
    const amt = Number(paymentAmount)
    if (amt <= 0) { toast.error('Enter valid amount'); return }

    const remaining = paymentModal.remaining - amt
    await updateCredit.mutateAsync({
      id: paymentModal.id,
      paid_amount: paymentModal.remaining - remaining + amt,
      status: remaining <= 0 ? 'paid' : 'partial',
    })
    setPaymentModal(null)
    setPaymentAmount('')
  }

  const sendWhatsAppReminder = (name: string, phone: string, amount: number) => {
    const msg = `🙏 ${name} ji,\n\nYeh ek friendly reminder hai ki aapka ₹${amount.toFixed(0)} ka udhar baaki hai.\n\nKripya jaldi se jaldi payment kar dein.\n\nDhanyavaad! 🙏\n— ${name}`
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const statusIcon = (status: string) => {
    if (status === 'paid') return <CheckCircle size={14} className="text-emerald-400" />
    if (status === 'partial') return <Clock size={14} className="text-amber-400" />
    return <AlertCircle size={14} className="text-red-400" />
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-gray-400">Total Outstanding</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(summary?.totalOutstanding || 0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400">Collected</p>
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(summary?.totalCollected || 0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400">Pending</p>
          <p className="text-lg font-bold text-amber-400">{summary?.pendingCount || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400">Total Entries</p>
          <p className="text-lg font-bold text-brand-400">{summary?.total || 0}</p>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex gap-3 items-center">
        <select className="input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        <button onClick={() => setShowForm(true)} className="btn btn-primary ml-auto">
          <Plus size={16} /> Add Udhar
        </button>
      </div>

      {/* List */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !credits?.length ? (
          <div className="text-center py-12">
            <IndianRupee size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No credit entries</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {credits.map((c) => {
              const remaining = c.total_amount - c.paid_amount
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcon(c.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-200">{c.customer_name}</p>
                        {c.phone && <p className="text-xs text-gray-500">📞 {c.phone}</p>}
                        {c.notes && <p className="text-xs text-gray-600">{c.notes}</p>}
                        <p className="text-xs text-gray-600">{formatDate(c.created_at || '')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-200">{formatCurrency(c.total_amount)}</p>
                      {c.paid_amount > 0 && (
                        <p className="text-xs text-emerald-400">Paid: {formatCurrency(c.paid_amount)}</p>
                      )}
                      {remaining > 0 && (
                        <p className="text-xs text-red-400 font-medium">Baaki: {formatCurrency(remaining)}</p>
                      )}
                    </div>
                  </div>
                  {c.status !== 'paid' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setPaymentModal({ id: c.id, name: c.customer_name, remaining })}
                        className="btn btn-sm btn-primary text-xs"
                      >
                        <IndianRupee size={12} /> Record Payment
                      </button>
                      {c.phone && (
                        <button
                          onClick={() => sendWhatsAppReminder(c.customer_name, c.phone!, remaining)}
                          className="btn btn-sm btn-secondary text-xs text-green-400 border-green-600/30"
                        >
                          💬 WhatsApp Reminder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="📒 New Udhar Entry" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Customer Name *</label>
            <input className="input" required value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} placeholder="Customer name" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="For WhatsApp reminder" />
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" min="1" className="input" required value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} placeholder="Total udhar amount" />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="e.g. Samsung charger + cable" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createCredit.isPending} className="btn btn-primary flex-1">
              {createCredit.isPending ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      {paymentModal && (
        <Modal isOpen onClose={() => { setPaymentModal(null); setPaymentAmount('') }} title="💰 Record Payment" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Recording payment from <strong>{paymentModal.name}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Remaining: <span className="text-red-400 font-bold">{formatCurrency(paymentModal.remaining)}</span>
            </p>
            <input
              type="number" min="1" max={paymentModal.remaining}
              className="input" placeholder="Payment amount (₹)"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => { setPaymentAmount(String(paymentModal.remaining)) }} className="btn btn-ghost btn-sm text-xs text-emerald-400">
                Full Payment
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setPaymentModal(null); setPaymentAmount('') }} className="btn btn-secondary flex-1">Cancel</button>
              <button
                onClick={handlePayment}
                disabled={updateCredit.isPending || !paymentAmount}
                className="btn btn-primary flex-1"
              >
                {updateCredit.isPending ? 'Saving...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
