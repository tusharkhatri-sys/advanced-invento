import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { cacheProducts, getCachedProducts } from '../lib/dexie'
import type { Product } from '../types'
import toast from 'react-hot-toast'

export const useProducts = (search?: string, category?: string, stockFilter?: string) => {
  return useQuery({
    queryKey: ['products', search, category, stockFilter],
    queryFn: async (): Promise<Product[]> => {
      // Only fetch needed columns for list view
      let query = supabase
        .from('products')
        .select('id,name,category,barcode,buy_price,sell_price,quantity,godown_quantity,low_stock_threshold,gst_rate,imei_serial,hsn_code')
        .order('name')

      if (search) {
        query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%`)
      }
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      // Stock filters done client-side (Supabase REST can't compare col-to-col)
      if (stockFilter === 'out') {
        query = query.eq('quantity', 0)
      }

      const { data, error } = await query
      if (error) throw error

      let result = (data || []) as Product[]

      // Client-side low stock filter (compare quantity <= low_stock_threshold)
      if (stockFilter === 'low') {
        result = result.filter(p => p.quantity > 0 && p.quantity <= p.low_stock_threshold)
      }

      // Cache in background - don't await
      if (result.length > 0) {
        cacheProducts(result).catch(() => {})
      }
      return result
    },
    staleTime: 1000 * 60 * 5, // 5 min stale - reduces re-fetches
    gcTime: 1000 * 60 * 10,   // keep in cache 10 min
    // Show cached data instantly while fresh data loads in background
    placeholderData: (prev) => prev,
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async (): Promise<Product> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Product
    },
    enabled: !!id,
  })
}

export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Product added!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Product updated!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Product deleted!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const { error } = await supabase
        .from('products')
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useTransferStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, qty, from_godown }: { id: string; qty: number; from_godown: boolean }) => {
      const { error } = await supabase.rpc('transfer_stock', {
        p_id: id,
        qty: qty,
        from_godown: from_godown
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Stock transferred successfully!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
