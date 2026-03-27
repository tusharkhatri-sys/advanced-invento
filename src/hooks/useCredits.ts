import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface Credit {
  id: string
  customer_name: string
  phone?: string
  sale_id?: string
  total_amount: number
  paid_amount: number
  status: 'pending' | 'partial' | 'paid'
  notes?: string
  due_date?: string
  created_at?: string
  updated_at?: string
}

export const useCredits = (status?: string) => {
  return useQuery({
    queryKey: ['credits', status],
    queryFn: async (): Promise<Credit[]> => {
      let query = supabase.from('credits').select('*').order('created_at', { ascending: false })
      if (status && status !== 'all') query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as Credit[]
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}

export const useCreateCredit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (credit: Omit<Credit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('credits').insert([credit]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits'] })
      toast.success('Credit entry added!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateCredit = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Credit> & { id: string }) => {
      const { data, error } = await supabase
        .from('credits')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits'] })
      toast.success('Credit updated!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useCreditSummary = () => {
  return useQuery({
    queryKey: ['credits', 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credits')
        .select('total_amount, paid_amount, status')
      if (error) throw error

      let totalOutstanding = 0
      let totalCollected = 0
      let pendingCount = 0
      ;(data || []).forEach((c) => {
        totalOutstanding += c.total_amount - c.paid_amount
        totalCollected += c.paid_amount
        if (c.status !== 'paid') pendingCount++
      })

      return { totalOutstanding, totalCollected, pendingCount, total: data?.length || 0 }
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}
