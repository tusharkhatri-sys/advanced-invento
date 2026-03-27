import { useState, useEffect } from 'react'
import { Save, Store } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, fetchProfile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    gstin: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        shop_name: user.shop_name || '',
        shop_address: user.shop_address || '',
        shop_phone: user.shop_phone || '',
        gstin: user.gstin || '',
      })
    }
  }, [user])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(form)
        .eq('id', user?.id)
      if (error) throw error
      await fetchProfile(user!.id)
      toast.success('Settings saved! ✅')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Store size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100">Shop Settings</h2>
            <p className="text-xs text-gray-500">This info appears on your invoices</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Owner Name</label>
            <input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="label">Shop Name *</label>
            <input className="input" required value={form.shop_name} onChange={(e) => set('shop_name', e.target.value)} placeholder="e.g. Sharma Mobile & Accessories" />
          </div>
          <div>
            <label className="label">Shop Address *</label>
            <input className="input" required value={form.shop_address} onChange={(e) => set('shop_address', e.target.value)} placeholder="e.g. Clock Tower, Jodhpur, Rajasthan" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={form.shop_phone} onChange={(e) => set('shop_phone', e.target.value)} placeholder="e.g. 9876543210" />
          </div>
          <div>
            <label className="label">GSTIN (GST Number)</label>
            <input className="input font-mono uppercase" maxLength={15} value={form.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} placeholder="e.g. 08ABCDE1234F1Z5" />
            {form.gstin && form.gstin.length !== 15 && (
              <p className="text-xs text-amber-400 mt-1">⚠️ GSTIN should be 15 characters</p>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Invoice Preview:</p>
            <p className="font-bold text-gray-100">{form.shop_name || 'Shop Name'}</p>
            <p className="text-xs text-gray-400">{form.shop_address || 'Address'}</p>
            <p className="text-xs text-gray-400">📞 {form.shop_phone || 'Phone'}</p>
            {form.gstin && <p className="text-xs text-gray-400 font-mono">GSTIN: {form.gstin}</p>}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary w-full">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
