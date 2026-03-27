import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Sale, SaleItem } from '../types'
import { generateBillNo } from '../lib/utils'
import toast from 'react-hot-toast'

interface DateRange {
  from: string
  to: string
}

export const useSales = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['sales', dateRange],
    queryFn: async (): Promise<Sale[]> => {
      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      if (dateRange) {
        query = query.gte('date', dateRange.from).lte('date', dateRange.to)
      }

      const { data, error } = await query
      if (error) throw error

      return (data || []).map((s) => ({
        ...s,
        items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items,
      })) as Sale[]
    },
  })
}

export const useTodaySales = () => {
  const today = new Date().toISOString().split('T')[0]
  return useSales({ from: today, to: today })
}

interface CreateSaleInput {
  items: SaleItem[]
  customer_name?: string
  phone?: string
  subtotal: number
  gst_amount: number
  discount: number
  total: number
  payment_method: 'cash' | 'upi' | 'card'
  is_inter_state: boolean
}

export const useCreateSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const billNo = generateBillNo()
      const today = new Date().toISOString().split('T')[0]

      const { data: sale, error } = await supabase
        .from('sales')
        .insert([{
          bill_no: billNo,
          customer_name: input.customer_name || null,
          phone: input.phone || null,
          items: JSON.stringify(input.items),
          subtotal: input.subtotal,
          gst_amount: input.gst_amount,
          discount: input.discount,
          total: input.total,
          payment_method: input.payment_method,
          is_inter_state: input.is_inter_state,
          returned: false,
          date: today,
        }])
        .select()
        .single()

      if (error) throw error

      // Deduct stock for each item
      for (const item of input.items) {
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single()

        if (product) {
          await supabase
            .from('products')
            .update({
              quantity: Math.max(0, product.quantity - item.qty),
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.product_id)
        }
      }

      return { ...sale, items: input.items } as Sale
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Bill created successfully!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useReturnSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (saleId: string) => {
      // Get sale items
      const { data: sale, error: fetchError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single()

      if (fetchError) throw fetchError

      const items: SaleItem[] = typeof sale.items === 'string'
        ? JSON.parse(sale.items)
        : sale.items

      // Restore stock
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single()

        if (product) {
          await supabase
            .from('products')
            .update({
              quantity: product.quantity + item.qty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.product_id)
        }
      }

      // Mark as returned
      const { error } = await supabase
        .from('sales')
        .update({ returned: true })
        .eq('id', saleId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Return processed! Stock restored.')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
