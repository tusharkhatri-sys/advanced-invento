import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  user: Profile | null
  loading: boolean
  error: string | null
  setUser: (user: Profile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          if (data.user) {
            await get().fetchProfile(data.user.id)
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Login failed'
          set({ error: message })
          throw err
        } finally {
          set({ loading: false })
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, error: null })
      },

      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        })
        if (error) throw error
      },

      fetchProfile: async (userId) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error || !data) {
          // Create a default profile if not found
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser.user) {
            const newProfile: Partial<Profile> = {
              id: userId,
              email: authUser.user.email || '',
              full_name: authUser.user.user_metadata?.full_name || 'Owner',
              shop_name: 'My Mobile Shop',
              role: 'owner',
            }
            await supabase.from('profiles').upsert(newProfile)
            set({ user: newProfile as Profile })
          }
        } else {
          set({ user: data as Profile })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
