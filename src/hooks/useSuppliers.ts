import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Supplier } from '../types'
import toast from 'react-hot-toast'

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')
      if (error) throw error
      return (data || []) as Supplier[]
    },
  })
}

export const useCreateSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Supplier, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([input])
        .select()
        .single()
      if (error) throw error
      return data as Supplier
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier added!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(rest)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Supplier
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier updated!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteSupplier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
