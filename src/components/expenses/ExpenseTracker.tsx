import { useState } from 'react'
import { Plus, Trash2, Wallet, IndianRupee } from 'lucide-react'
import { useExpenses, useCreateExpense, useDeleteExpense, useExpenseSummary } from '../../hooks/useExpenses'
import { formatCurrency, formatDate, formatDateForInput } from '../../lib/utils'
import Modal from '../ui/Modal'
import { ConfirmModal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const expenseCategories = [
  { value: 'rent', label: '🏠 Rent', color: '#ef4444' },
  { value: 'salary', label: '👤 Salary', color: '#f59e0b' },
  { value: 'electricity', label: '⚡ Electricity', color: '#3b82f6' },
  { value: 'transport', label: '🚚 Transport', color: '#8b5cf6' },
  { value: 'packaging', label: '📦 Packaging', color: '#ec4899' },
  { value: 'food', label: '🍵 Food/Chai', color: '#14b8a6' },
  { value: 'maintenance', label: '🔧 Maintenance', color: '#f97316' },
  { value: 'other', label: '📋 Other', color: '#6b7280' },
]

const getCatLabel = (v: string) => expenseCategories.find((c) => c.value === v)?.label || v
const getCatColor = (v: string) => expenseCategories.find((c) => c.value === v)?.color || '#6b7280'

export default function ExpenseTracker() {
  const [from, setFrom] = useState(formatDateForInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [to, setTo] = useState(formatDateForInput())
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: expenses, isLoading } = useExpenses(from, to)
  const { data: summary } = useExpenseSummary()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()

  const [form, setForm] = useState({
    category: 'other',
    amount: '',
    description: '',
    date: formatDateForInput(),
    payment_method: 'cash',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createExpense.mutateAsync({
      category: form.category,
      amount: Number(form.amount),
      description: form.description || undefined,
      date: form.date,
      payment_method: form.payment_method,
    })
    setShowForm(false)
    setForm({ category: 'other', amount: '', description: '', date: formatDateForInput(), payment_method: 'cash' })
  }

  const periodTotal = (expenses || []).reduce((s, e) => s + e.amount, 0)

  const pieData = summary ? Object.entries(summary.byCategory).map(([cat, amt]) => ({
    name: getCatLabel(cat),
    value: amt,
    color: getCatColor(cat),
  })) : []

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-gray-400">This Month</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(summary?.total || 0)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400">Period Total</p>
          <p className="text-lg font-bold text-amber-400">{formatCurrency(periodTotal)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400">Entries</p>
          <p className="text-lg font-bold text-brand-400">{expenses?.length || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-400">Categories</p>
          <p className="text-lg font-bold text-gray-200">{summary ? Object.keys(summary.byCategory).length : 0}</p>
        </div>
      </div>

      {/* Chart + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">📊 This Month by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="label">From</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary w-full">
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !expenses?.length ? (
          <div className="text-center py-12">
            <Wallet size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No expenses recorded</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCatLabel(e.category).split(' ')[0]}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{getCatLabel(e.category).split(' ').slice(1).join(' ')}</p>
                    {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
                    <p className="text-xs text-gray-600">{formatDate(e.date)} • {e.payment_method.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-red-400">{formatCurrency(e.amount)}</p>
                  <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="💸 Add Expense" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {expenseCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" min="1" step="0.01" className="input" required value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="e.g. 500" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional note" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label">Payment</label>
              <select className="input" value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createExpense.isPending} className="btn btn-primary flex-1">
              {createExpense.isPending ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await deleteExpense.mutateAsync(deleteId!); setDeleteId(null) }} message="Delete this expense?" loading={deleteExpense.isPending} />
    </div>
  )
}
