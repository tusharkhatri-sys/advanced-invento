import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface Expense {
  id: string
  category: string
  amount: number
  description?: string
  date: string
  payment_method: string
  created_at?: string
}

export const useExpenses = (from?: string, to?: string) => {
  return useQuery({
    queryKey: ['expenses', from, to],
    queryFn: async (): Promise<Expense[]> => {
      let query = supabase.from('expenses').select('*').order('date', { ascending: false })
      if (from) query = query.gte('date', from)
      if (to) query = query.lte('date', to)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as Expense[]
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}

export const useCreateExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('expenses').insert([expense]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense added!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense deleted!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useExpenseSummary = () => {
  return useQuery({
    queryKey: ['expenses', 'summary'],
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount, date')
        .gte('date', monthStart)
      if (error) throw error

      const byCategory: Record<string, number> = {}
      let total = 0
      ;(data || []).forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
        total += e.amount
      })

      return { byCategory, total, count: data?.length || 0 }
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  })
}
