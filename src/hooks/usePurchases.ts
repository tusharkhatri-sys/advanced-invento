import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Purchase } from '../types'
import toast from 'react-hot-toast'

export const usePurchases = () => {
  return useQuery({
    queryKey: ['purchases'],
    queryFn: async (): Promise<Purchase[]> => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*, products(name, category), suppliers(name)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []) as Purchase[]
    },
  })
}

export const useCreatePurchase = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Purchase, 'id' | 'created_at' | 'product' | 'supplier'>) => {
      // Insert purchase
      const { data: purchase, error } = await supabase
        .from('purchases')
        .insert([input])
        .select()
        .single()
      if (error) throw error

      // Increase product stock
      const { data: product } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', input.product_id)
        .single()

      if (product) {
        await supabase
          .from('products')
          .update({
            quantity: product.quantity + input.qty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.product_id)
      }

      return purchase as Purchase
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Purchase entry added! Stock updated.')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
