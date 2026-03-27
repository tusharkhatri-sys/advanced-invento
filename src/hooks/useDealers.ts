import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface Dealer {
  id: string
  name: string
  business_name?: string
  phone: string
  address?: string
  gstin?: string
  credit_limit: number
  outstanding_balance: number
  price_tier: 'retail' | 'wholesale' | 'super_wholesale'
  notes?: string
  created_at?: string
}

export const useDealers = (search?: string) => {
  return useQuery({
    queryKey: ['dealers', search],
    queryFn: async (): Promise<Dealer[]> => {
      let query = supabase.from('dealers').select('*').order('name')
      if (search) query = query.or(`name.ilike.%${search}%,business_name.ilike.%${search}%,phone.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as Dealer[]
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}

export const useCreateDealer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dealer: Omit<Dealer, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('dealers').insert([dealer]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dealers'] }); toast.success('Dealer added!') },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateDealer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Dealer> & { id: string }) => {
      const { data, error } = await supabase.from('dealers').update(rest).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dealers'] }); toast.success('Dealer updated!') },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteDealer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dealers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dealers'] }); toast.success('Dealer deleted!') },
    onError: (err: Error) => toast.error(err.message),
  })
}
