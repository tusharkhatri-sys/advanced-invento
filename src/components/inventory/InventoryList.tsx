import { useState, useCallback } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Package, RefreshCw, ArrowRightLeft, Store, Warehouse } from 'lucide-react'
import { useProducts, useDeleteProduct, useTransferStock } from '../../hooks/useProducts'
import { categoryLabels, categoryColors, formatCurrency, getStockStatus } from '../../lib/utils'
import Modal, { ConfirmModal } from '../ui/Modal'
import ProductForm from './ProductForm'
import LoadingSpinner from '../ui/LoadingSpinner'
import type { Product, Category } from '../../types'

const categories: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Categories' },
  { value: 'charger', label: 'Charger' },
  { value: 'case', label: 'Mobile Case' },
  { value: 'earphone', label: 'Earphone' },
  { value: 'screen_guard', label: 'Screen Guard' },
  { value: 'cable', label: 'Cable' },
  { value: 'powerbank', label: 'Power Bank' },
  { value: 'other', label: 'Other' },
]

export default function InventoryList() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [transferProduct, setTransferProduct] = useState<Product | null>(null)
  const [transferForm, setTransferForm] = useState({ qty: '', from_godown: true })

  const { data: products, isLoading, refetch } = useProducts(
    search || undefined,
    category === 'all' ? undefined : category,
    stockFilter === 'all' ? undefined : stockFilter
  )
  const deleteMutation = useDeleteProduct()
  const transferMutation = useTransferStock()

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferProduct || !transferForm.qty) return
    await transferMutation.mutateAsync({
      id: transferProduct.id,
      qty: Number(transferForm.qty),
      from_godown: transferForm.from_godown
    })
    setTransferProduct(null)
    setTransferForm({ qty: '', from_godown: true })
  }

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    await deleteMutation.mutateAsync(deleteId)
    setDeleteId(null)
  }, [deleteId, deleteMutation])

  const stockBadge = (product: Product) => {
    const status = getStockStatus(product.quantity, product.low_stock_threshold)
    if (status === 'out') return <span className="badge badge-red">Out of Stock</span>
    if (status === 'low') return <span className="badge badge-yellow">{product.quantity} low</span>
    return <span className="badge badge-green">{product.quantity}</span>
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search products or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input w-full sm:w-40"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="input w-full sm:w-36"
        >
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <button onClick={() => refetch()} className="btn btn-secondary btn-sm px-3">
          <RefreshCw size={14} />
        </button>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Product count */}
      <p className="text-xs text-gray-500">
        {isLoading ? 'Loading...' : `${products?.length || 0} products found`}
      </p>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size={28} /></div>
        ) : !products?.length ? (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No products found</p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary mt-4 btn-sm">
              <Plus size={14} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header hidden sm:table-cell">Category</th>
                  <th className="table-header">Buy Price</th>
                  <th className="table-header">Sell Price</th>
                  <th className="table-header">Stock</th>
                  <th className="table-header">GST</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-200 text-xs sm:text-sm">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs text-gray-600 font-mono">{product.barcode}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className={`badge ${categoryColors[product.category] || 'badge-blue'}`}>
                        {categoryLabels[product.category] || product.category}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400 text-xs">
                      {formatCurrency(product.buy_price)}
                    </td>
                    <td className="table-cell font-medium text-emerald-400 text-xs">
                      {formatCurrency(product.sell_price)}
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 min-w-[100px]">
                          <Store size={14} className="text-gray-400" />
                          <div className="flex-1">{stockBadge(product)}</div>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-[100px]">
                          <Warehouse size={14} className="text-purple-400" />
                          <div className="flex-1">
                            <span className={`badge ${product.godown_quantity! > 0 ? 'badge-purple' : 'badge-gray'}`}>
                              {product.godown_quantity || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs text-gray-500">{product.gst_rate}%</span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setTransferProduct(product)}
                          title="Transfer Stock"
                          className="p-1.5 rounded-lg hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          <ArrowRightLeft size={14} />
                        </button>
                        <button
                          onClick={() => setEditProduct(product)}
                          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-brand-400 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddForm || editProduct) && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowAddForm(false); setEditProduct(null) }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="Delete this product? Stock data will be lost."
        loading={deleteMutation.isPending}
      />

      {/* Transfer Modal */}
      <Modal isOpen={!!transferProduct} onClose={() => setTransferProduct(null)} title="🔄 Transfer Stock" size="sm">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
            <p className="text-sm font-medium text-gray-200">{transferProduct?.name}</p>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-emerald-400 flex items-center gap-1"><Store size={12}/> Shop: {transferProduct?.quantity}</span>
              <span className="text-purple-400 flex items-center gap-1"><Warehouse size={12}/> Godown: {transferProduct?.godown_quantity || 0}</span>
            </div>
          </div>
          
          <div>
            <label className="label">Direction</label>
            <div className="flex gap-2 p-1 bg-gray-900 rounded-lg">
              <button
                type="button"
                onClick={() => setTransferForm({ ...transferForm, from_godown: true })}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${transferForm.from_godown ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Godown → Shop
              </button>
              <button
                type="button"
                onClick={() => setTransferForm({ ...transferForm, from_godown: false })}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${!transferForm.from_godown ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                Shop → Godown
              </button>
            </div>
          </div>

          <div>
            <label className="label">Quantity to Transfer</label>
            <input
              type="number" required min="1"
              max={transferForm.from_godown ? transferProduct?.godown_quantity || 1 : transferProduct?.quantity || 1}
              className="input"
              value={transferForm.qty}
              onChange={e => setTransferForm({ ...transferForm, qty: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setTransferProduct(null)} className="btn btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={transferMutation.isPending || !transferForm.qty} className="btn btn-primary flex-1">
              {transferMutation.isPending ? 'Moving...' : 'Transfer Now'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
