import { useState } from 'react'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import {
  useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier
} from '../../hooks/useSuppliers'
import Modal from '../ui/Modal'
import { ConfirmModal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import type { Supplier } from '../../types'

const blankForm = { name: '', phone: '', address: '', gstin: '' }

export default function SupplierList() {
  const { data: suppliers, isLoading } = useSuppliers()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(blankForm)

  const openEdit = (s: Supplier) => {
    setEditSupplier(s)
    setForm({ name: s.name, phone: s.phone, address: s.address || '', gstin: s.gstin || '' })
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditSupplier(null)
    setForm(blankForm)
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editSupplier) {
      await updateSupplier.mutateAsync({ id: editSupplier.id, ...form })
    } else {
      await createSupplier.mutateAsync(form as Omit<Supplier, 'id' | 'created_at'>)
    }
    handleClose()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{suppliers?.length || 0} suppliers</p>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !suppliers?.length ? (
          <div className="text-center py-12">
            <Users size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No suppliers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-200">{s.name}</p>
                  <p className="text-xs text-gray-500">📞 {s.phone}</p>
                  {s.address && <p className="text-xs text-gray-600">{s.address}</p>}
                  {s.gstin && <p className="text-xs text-gray-600 font-mono">GSTIN: {s.gstin}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-brand-400 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editSupplier ? '✏️ Edit Supplier' : '➕ Add Supplier'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required placeholder="Supplier name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" required placeholder="Mobile number" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="City, State" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div>
            <label className="label">GSTIN</label>
            <input className="input font-mono" placeholder="GST number (optional)" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleClose} className="btn btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={createSupplier.isPending || updateSupplier.isPending}
              className="btn btn-primary flex-1"
            >
              {createSupplier.isPending || updateSupplier.isPending ? 'Saving...' : editSupplier ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { await deleteSupplier.mutateAsync(deleteId!); setDeleteId(null) }}
        message="Delete this supplier? This won't affect existing purchase records."
        loading={deleteSupplier.isPending}
      />
    </div>
  )
}
