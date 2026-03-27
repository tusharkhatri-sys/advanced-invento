import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DamagedStock, Product } from '../types'
import toast from 'react-hot-toast'

export const useDamagedStock = () => {
  return useQuery({
    queryKey: ['damaged_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('damaged_stock')
        .select(`
          *,
          product:products (id, name, category, image_url)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (DamagedStock & { product: Product })[]
    },
  })
}

export const useCreateDamagedStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<DamagedStock, 'id' | 'created_at'>) => {
      // 1. Insert into damaged_stock
      const { data, error } = await supabase
        .from('damaged_stock')
        .insert([payload])
        .select()
        .single()
      if (error) throw error

      // 2. Reduce qty from products table
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_id: payload.product_id,
        q: payload.qty
      })
      if (stockError && !stockError.message.includes('Function decrement_stock does not exist')) {
        // Fallback if RPC doesn't exist
        const { data: currentProduct } = await supabase.from('products').select('quantity').eq('id', payload.product_id).single()
        if (currentProduct) {
          await supabase.from('products').update({ quantity: currentProduct.quantity - payload.qty }).eq('id', payload.product_id)
        }
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['damaged_stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Damaged stock recorded & inventory updated!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteDamagedStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, product_id, qty }: { id: string, product_id: string, qty: number }) => {
      // 1. Delete record
      const { error } = await supabase.from('damaged_stock').delete().eq('id', id)
      if (error) throw error

      // 2. Restore stock
      const { data: currentProduct } = await supabase.from('products').select('quantity').eq('id', product_id).single()
      if (currentProduct) {
        await supabase.from('products').update({ quantity: currentProduct.quantity + qty }).eq('id', product_id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['damaged_stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Record deleted & stock restored')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
