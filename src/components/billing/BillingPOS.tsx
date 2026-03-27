import { useState } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, CreditCard, Banknote, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useCreateSale } from '../../hooks/useSales'
import { useCartStore } from '../../stores/cartStore'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency, calculateGST, generateBillNo } from '../../lib/utils'
import { generateInvoicePDF } from './generatePDF'
import type { Sale, SaleItem } from '../../types'
import toast from 'react-hot-toast'

export default function BillingPOS() {
  const [search, setSearch] = useState('')
  const [showInvoice, setShowInvoice] = useState<Sale | null>(null)
  const { data: products } = useProducts(search || undefined)
  const createSale = useCreateSale()
  const { user } = useAuthStore()

  const {
    items, customerName, customerPhone, discount,
    paymentMethod, isInterState,
    addItem, removeItem, updateQty, updateItemDiscount,
    setCustomer, setDiscount, setPaymentMethod, setInterState,
    clearCart, getSubtotal, getGSTAmount, getTotal
  } = useCartStore()

  const subtotal = getSubtotal()
  const gstAmount = getGSTAmount()
  const total = getTotal()

  const filteredProducts = (products || []).filter(
    (p) => p.quantity > 0 && (
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').includes(search)
    )
  ).slice(0, 20)

  const handleCompleteSale = async () => {
    if (!items.length) {
      toast.error('Add at least one item to the bill')
      return
    }

    const saleItems: SaleItem[] = items.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      qty: item.qty,
      sell_price: item.unit_price,
      gst_rate: item.product.gst_rate,
      discount: item.discount,
      total: (item.unit_price * item.qty) - item.discount,
    }))

    try {
      const sale = await createSale.mutateAsync({
        items: saleItems,
        customer_name: customerName || undefined,
        phone: customerPhone || undefined,
        subtotal,
        gst_amount: gstAmount,
        discount,
        total,
        payment_method: paymentMethod,
        is_inter_state: isInterState,
      })

      setShowInvoice(sale)
      clearCart()
    } catch {
      // error handled by hook
    }
  }

  const handleDownloadPDF = (sale: Sale) => {
    const doc = generateInvoicePDF(sale, {
      name: user?.shop_name || 'My Mobile Shop',
      address: user?.shop_address || 'Jodhpur, Rajasthan',
      phone: user?.shop_phone || '',
      gstin: user?.gstin,
    })
    doc.save(`Invoice-${sale.bill_no}.pdf`)
    toast.success('Invoice downloaded!')
  }

  const handleWhatsApp = (sale: Sale) => {
    const msg = `🧾 *Bill from ${user?.shop_name || 'My Shop'}*\n\nBill No: ${sale.bill_no}\nDate: ${new Date(sale.created_at || sale.date).toLocaleDateString('en-IN')}\n\n${sale.items.map((i) => `• ${i.product_name} x${i.qty} = ${formatCurrency(i.total)}`).join('\n')}\n\nSubtotal: ${formatCurrency(sale.subtotal)}\nGST: ${formatCurrency(sale.gst_amount)}\n*Total: ${formatCurrency(sale.total)}*\nPayment: ${sale.payment_method.toUpperCase()}\n\n_Thank you for your purchase!_`
    const url = sale.phone
      ? `https://wa.me/91${sale.phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full animate-fade-in">
      {/* Left: Product search */}
      <div className="flex-1 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search products or scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="card p-0 overflow-hidden">
          {!filteredProducts.length ? (
            <p className="text-center text-gray-500 text-sm py-8">
              {search ? 'No products found' : 'Type to search products'}
            </p>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredProducts.map((p) => {
                const inCart = items.find((i) => i.product.id === p.id)
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-gray-200 font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(p.sell_price)} • GST {p.gst_rate}% • Stock: {p.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => addItem(p)}
                      disabled={p.quantity === 0}
                      className={`btn btn-sm ${inCart ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      <Plus size={14} /> {inCart ? `Add (${inCart.qty})` : 'Add'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Bill Cart */}
      <div className="w-full lg:w-96 space-y-3">
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={16} className="text-brand-400" />
            <h3 className="font-semibold text-gray-200 text-sm">Current Bill</h3>
            {items.length > 0 && (
              <button onClick={clearCart} className="btn btn-ghost btn-sm ml-auto text-red-400 hover:text-red-300">
                Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          {!items.length ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <ShoppingCart size={28} className="mx-auto mb-2 opacity-30" />
              Add items from left panel
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="p-3 rounded-xl bg-gray-800/60">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-gray-200 font-medium flex-1 leading-tight">{item.product.name}</p>
                    <button onClick={() => removeItem(item.product.id)} className="text-gray-600 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.product.id, item.qty - 1)}
                      className="p-1 rounded-lg bg-gray-700 hover:bg-gray-600"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-bold text-gray-200 w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.product.id, item.qty + 1)}
                      className="p-1 rounded-lg bg-gray-700 hover:bg-gray-600"
                    >
                      <Plus size={11} />
                    </button>
                    <span className="text-xs text-gray-400 ml-1">× {formatCurrency(item.unit_price)}</span>
                    <span className="text-xs font-medium text-emerald-400 ml-auto">
                      {formatCurrency(item.unit_price * item.qty - item.discount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-600">Disc:</span>
                    <input
                      type="number" min="0" step="1"
                      value={item.discount}
                      onChange={(e) => updateItemDiscount(item.product.id, Number(e.target.value))}
                      className="input text-xs py-0.5 w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer */}
          {items.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <input
                className="input text-sm"
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomer(e.target.value, customerPhone)}
              />
              <input
                className="input text-sm"
                placeholder="Customer Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomer(customerName, e.target.value)}
              />
              <input
                type="number" min="0"
                className="input text-sm"
                placeholder="Bill discount (₹)"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>
          )}

          {/* GST toggle */}
          {items.length > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-800/50">
              <span className="text-xs text-gray-400">
                {isInterState ? 'IGST (Inter-State)' : 'CGST+SGST (Intra-State)'}
              </span>
              <button onClick={() => setInterState(!isInterState)} className="text-brand-400">
                {isInterState ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
            </div>
          )}

          {/* Payment method */}
          {items.length > 0 && (
            <div className="flex gap-2">
              {([
                { v: 'cash', label: 'Cash', icon: Banknote },
                { v: 'upi', label: 'UPI', icon: Smartphone },
                { v: 'card', label: 'Card', icon: CreditCard },
              ] as const).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => setPaymentMethod(v)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all
                    ${paymentMethod === v
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-800">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {isInterState ? (
                <div className="flex justify-between text-xs text-gray-400">
                  <span>IGST</span>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>CGST</span>
                    <span>{formatCurrency(gstAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>SGST</span>
                    <span>{formatCurrency(gstAmount / 2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-bold text-gray-100 text-base mt-2 p-2 rounded-xl bg-brand-600/20">
                <span>TOTAL</span>
                <span className="text-brand-300">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Generate Bill */}
          <button
            onClick={handleCompleteSale}
            disabled={!items.length || createSale.isPending}
            className="btn btn-primary w-full btn-lg"
          >
            <Receipt size={18} />
            {createSale.isPending ? 'Processing...' : 'Generate Bill'}
          </button>
        </div>
      </div>

      {/* Invoice modal */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-gray-100">Bill Created!</h3>
              <p className="text-brand-400 font-mono text-sm">{showInvoice.bill_no}</p>
              <p className="text-2xl font-bold text-gray-100 mt-2">{formatCurrency(showInvoice.total)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDownloadPDF(showInvoice)}
                className="btn btn-primary"
              >
                📄 Download PDF
              </button>
              <button
                onClick={() => handleWhatsApp(showInvoice)}
                className="btn btn-secondary border-green-600/30 text-green-400"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
              >
                🖨️ Print
              </button>
              <button
                onClick={() => setShowInvoice(null)}
                className="btn btn-ghost text-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
