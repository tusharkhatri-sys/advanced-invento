import { useState, useEffect } from 'react'
import { X, Camera, Warehouse } from 'lucide-react'
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts'
import { useSuppliers } from '../../hooks/useSuppliers'
import { gstRates } from '../../lib/utils'
import Modal from '../ui/Modal'
import BarcodeScanner from './BarcodeScanner.js'
import type { Product, Category } from '../../types'

interface Props {
  product?: Product | null
  onClose: () => void
}

const categories: Array<{ value: Category; label: string }> = [
  { value: 'charger', label: 'Charger' },
  { value: 'case', label: 'Mobile Case' },
  { value: 'earphone', label: 'Earphone' },
  { value: 'screen_guard', label: 'Screen Guard' },
  { value: 'cable', label: 'Cable' },
  { value: 'powerbank', label: 'Power Bank' },
  { value: 'battery', label: 'Mobile Battery' },
  { value: 'other', label: 'Other' },
]

const defaultForm = {
  name: '',
  category: 'charger' as Category,
  barcode: '',
  imei_serial: '',
  buy_price: 0,
  sell_price: 0,
  wholesale_price: 0,
  min_wholesale_qty: 5,
  box_size: 1,
  unit: 'piece',
  quantity: 0,
  godown_quantity: 0,
  low_stock_threshold: 5,
  gst_rate: 18,
  hsn_code: '',
}

export default function ProductForm({ product, onClose }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [showScanner, setShowScanner] = useState(false)
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        category: product.category,
        barcode: product.barcode || '',
        imei_serial: product.imei_serial || '',
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        wholesale_price: (product as any).wholesale_price || 0,
        min_wholesale_qty: (product as any).min_wholesale_qty || 10,
        box_size: (product as any).box_size || 1,
        unit: (product as any).unit || 'piece',
        quantity: product.quantity,
        godown_quantity: product.godown_quantity || 0,
        low_stock_threshold: product.low_stock_threshold,
        gst_rate: product.gst_rate,
        hsn_code: product.hsn_code || '',
      })
    }
  }, [product])

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      buy_price: Number(form.buy_price),
      sell_price: Number(form.sell_price),
      wholesale_price: Number(form.wholesale_price),
      min_wholesale_qty: Number(form.min_wholesale_qty),
      box_size: Number(form.box_size),
      quantity: Number(form.quantity),
      godown_quantity: Number(form.godown_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
      gst_rate: Number(form.gst_rate),
    }
    if (product) {
      await updateMutation.mutateAsync({ id: product.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload as Omit<Product, 'id' | 'created_at' | 'updated_at'>)
    }
    onClose()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        title={product ? '✏️ Edit Product' : '➕ Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Product Name *</label>
              <input
                className="input"
                required
                placeholder="e.g. Samsung 25W Fast Charger"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value as Category)}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">GST Rate</label>
              <select className="input" value={form.gst_rate} onChange={(e) => set('gst_rate', e.target.value)}>
                {gstRates.map((r) => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Buy Price (₹) *</label>
              <input
                type="number" min="0" step="0.01" className="input"
                value={form.buy_price}
                onChange={(e) => set('buy_price', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Retail Price (₹) *</label>
              <input
                type="number" min="0" step="0.01" className="input"
                value={form.sell_price}
                onChange={(e) => set('sell_price', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">📦 Wholesale Price (₹)</label>
              <input
                type="number" min="0" step="0.01" className="input"
                value={form.wholesale_price}
                onChange={(e) => set('wholesale_price', e.target.value)}
                placeholder="Bulk rate"
              />
            </div>

            <div>
              <label className="label">Min Qty for Wholesale</label>
              <input
                type="number" min="1" className="input"
                value={form.min_wholesale_qty}
                onChange={(e) => set('min_wholesale_qty', e.target.value)}
              />
            </div>

            <div>
              <label className="label">Box/Pack Size</label>
              <input
                type="number" min="1" className="input"
                value={form.box_size}
                onChange={(e) => set('box_size', e.target.value)}
                placeholder="Pcs per box"
              />
            </div>

            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                <option value="piece">Piece</option>
                <option value="box">Box</option>
                <option value="dozen">Dozen</option>
                <option value="set">Set</option>
                <option value="pair">Pair</option>
              </select>
            </div>

            <div>
              <label className="label">Stock Quantity *</label>
              <input
                type="number" min="0" className="input"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Low Stock Alert At</label>
              <input
                type="number" min="0" className="input"
                value={form.low_stock_threshold}
                onChange={(e) => set('low_stock_threshold', e.target.value)}
              />
            </div>

            <div className="bg-purple-900/10 border border-purple-500/20 p-3 rounded-xl sm:col-span-2">
              <label className="label text-purple-400 font-bold flex items-center gap-2">
                <Warehouse size={14} /> Initial Godown Stock
              </label>
              <input
                type="number" min="0" className="input border-purple-500/30 focus:border-purple-500"
                value={form.godown_quantity}
                onChange={(e) => set('godown_quantity', e.target.value)}
                placeholder="Stock kept in warehouse"
              />
              <p className="text-[10px] text-purple-400/70 mt-1">This stock is separate from shop inventory.</p>
            </div>

            <div>
              <label className="label">Barcode / SKU</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Scan or type barcode"
                  value={form.barcode}
                  onChange={(e) => set('barcode', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="btn btn-secondary px-3"
                >
                  <Camera size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="label">HSN Code</label>
              <input
                className="input"
                placeholder="e.g. 8504"
                value={form.hsn_code}
                onChange={(e) => set('hsn_code', e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label">IMEI / Serial (for phones)</label>
              <input
                className="input"
                placeholder="Optional"
                value={form.imei_serial}
                onChange={(e) => set('imei_serial', e.target.value)}
              />
            </div>
          </div>

          {/* Profit margin preview */}
          {form.buy_price > 0 && form.sell_price > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <p className="text-xs text-emerald-400">
                🏪 Retail Margin: ₹{(Number(form.sell_price) - Number(form.buy_price)).toFixed(2)}/pc
                ({(((Number(form.sell_price) - Number(form.buy_price)) / Number(form.buy_price)) * 100).toFixed(1)}%)
              </p>
              {Number(form.wholesale_price) > 0 && (
                <p className="text-xs text-blue-400">
                  📦 Wholesale Margin: ₹{(Number(form.wholesale_price) - Number(form.buy_price)).toFixed(2)}/pc
                  ({(((Number(form.wholesale_price) - Number(form.buy_price)) / Number(form.buy_price)) * 100).toFixed(1)}%)
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isPending} className="btn btn-primary flex-1">
              {isPending ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {showScanner && (
        <BarcodeScanner
          onScan={(code: string) => { set('barcode', code); setShowScanner(false) }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
