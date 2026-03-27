import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Customer } from '../types'
import toast from 'react-hot-toast'

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')
      if (error) throw error
      return data || []
    },
  })
}

export const useCreateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'total_purchases' | 'total_spent' | 'outstanding_balance'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer added!')
    },
    onError: (err: Error) => {
      if (err.message.includes('unique constraint')) {
        toast.error('Mobile number already registered!')
      } else {
        toast.error(err.message)
      }
    },
  })
}

export const useUpdateCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer updated!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteCustomer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted!')
    },
    onError: (err: Error) => toast.error('Check if customer is linked to sales first'),
  })
}
