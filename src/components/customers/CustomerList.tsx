import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, IndianRupee, MessageCircle, Users } from 'lucide-react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers'
import Modal, { ConfirmModal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import { formatCurrency } from '../../lib/utils'
import type { Customer } from '../../types'

const blankForm = {
  name: '', phone: '', address: '', notes: '',
  total_purchases: 0, total_spent: 0, outstanding_balance: 0
}

export default function CustomerList() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(blankForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: customers, isLoading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const filtered = (customers || []).filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  )

  const handleEdit = (c: Customer) => {
    setFormData({
      name: c.name, phone: c.phone, address: c.address || '', notes: c.notes || '',
      total_purchases: c.total_purchases, total_spent: c.total_spent, outstanding_balance: c.outstanding_balance
    })
    setEditingId(c.id)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateCustomer.mutateAsync({ id: editingId, ...formData })
    } else {
      await createCustomer.mutateAsync(formData)
    }
    setIsModalOpen(false)
  }

  const sendWhatsAppMsg = (c: Customer) => {
    const defaultMsg = c.outstanding_balance > 0 
      ? `🙏 Namaste ${c.name} ji,\nAapka ₹${c.outstanding_balance} baaki hai. Kripaya payment kara dein.` 
      : `🙏 Namaste ${c.name} ji,\nAdvanced Invento me aapka swagat hai!`
    
    // Convert 10 digit Indian number to 91 format
    const phone = c.phone.length === 10 ? `91${c.phone}` : c.phone.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(defaultMsg)}`, '_blank')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100">Customers CRM</h2>
            <p className="text-xs text-gray-500">Retail customer directory</p>
          </div>
        </div>
        <button 
          onClick={() => { setFormData(blankForm); setEditingId(null); setIsModalOpen(true) }}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search customer name or phone..." 
          className="input pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner /></div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-gray-500 bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th className="p-4 font-medium">Customer Details</th>
                <th className="p-4 font-medium text-right">Lifetime Spend</th>
                <th className="p-4 font-medium text-right">Outstanding (Udhar)</th>
                <th className="p-4 font-medium">Auto WhatsApp</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-gray-200">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                    {c.address && <p className="text-[10px] text-gray-600 truncate max-w-xs">{c.address}</p>}
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-gray-300 font-medium">{formatCurrency(c.total_spent)}</p>
                    <p className="text-[10px] text-gray-500">{c.total_purchases} Bills</p>
                  </td>
                  <td className="p-4 text-right">
                    {c.outstanding_balance > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-400 font-medium bg-red-400/10 px-2 py-1 rounded-full text-xs">
                        <IndianRupee size={10} /> {c.outstanding_balance} baaki
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => sendWhatsAppMsg(c)}
                      className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg transition-colors"
                    >
                      <MessageCircle size={14} /> Send Msg
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                    No customers found matching "{search}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input required className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ramesh Kumar" />
            </div>
            <div className="col-span-2">
              <label className="label">WhatsApp Mobile Number</label>
              <input required pattern="[0-9]{10}" title="10 digit mobile number" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
            </div>
            <div className="col-span-2">
              <label className="label">Address (Optional)</label>
              <textarea className="input text-sm" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Shop 3, Main Market..." />
            </div>
            <div className="col-span-2">
              <label className="label">Private Notes (Optional)</label>
              <input className="input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Regular buyer, asks for discount" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={createCustomer.isPending || updateCustomer.isPending}>
              {editingId ? 'Update' : 'Save'} Customer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await deleteCustomer.mutateAsync(deleteId)
            setDeleteId(null)
          }
        }}
        title="Delete Customer"
        message="Are you sure? This cannot be undone."
      />
    </div>
  )
}
