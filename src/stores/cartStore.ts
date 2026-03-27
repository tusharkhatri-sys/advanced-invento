import { create } from 'zustand'
import type { CartItem, Product } from '../types'

interface CartState {
  items: CartItem[]
  customerName: string
  customerPhone: string
  discount: number
  paymentMethod: 'cash' | 'upi' | 'card'
  isInterState: boolean
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  updateItemDiscount: (productId: string, discount: number) => void
  setCustomer: (name: string, phone: string) => void
  setDiscount: (discount: number) => void
  setPaymentMethod: (method: 'cash' | 'upi' | 'card') => void
  setInterState: (interState: boolean) => void
  clearCart: () => void
  getSubtotal: () => number
  getGSTAmount: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  discount: 0,
  paymentMethod: 'cash',
  isInterState: false,

  addItem: (product) => {
    const items = get().items
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      set({ items: items.map((i) =>
        i.product.id === product.id
          ? { ...i, qty: i.qty + 1 }
          : i
      )})
    } else {
      set({ items: [...items, { product, qty: 1, discount: 0, unit_price: product.sell_price }] })
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) })
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId)
      return
    }
    set({ items: get().items.map((i) => i.product.id === productId ? { ...i, qty } : i) })
  },

  updateItemDiscount: (productId, discount) => {
    set({ items: get().items.map((i) => i.product.id === productId ? { ...i, discount } : i) })
  },

  setCustomer: (name, phone) => set({ customerName: name, customerPhone: phone }),
  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setInterState: (interState) => set({ isInterState: interState }),

  clearCart: () => set({
    items: [], customerName: '', customerPhone: '',
    discount: 0, paymentMethod: 'cash', isInterState: false
  }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const itemTotal = (item.unit_price * item.qty) - item.discount
      return sum + itemTotal
    }, 0) - get().discount
  },

  getGSTAmount: () => {
    return get().items.reduce((sum, item) => {
      const itemSubtotal = (item.unit_price * item.qty) - item.discount
      const gstAmount = (itemSubtotal * item.product.gst_rate) / 100
      return sum + gstAmount
    }, 0)
  },

  getTotal: () => get().getSubtotal() + get().getGSTAmount(),
}))
