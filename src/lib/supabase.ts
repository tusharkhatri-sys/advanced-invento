import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zarfdxqzwlurgeosafvv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphcmZkeHF6d2x1cmdlb3NhZnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODUzODMsImV4cCI6MjA5MDE2MTM4M30.Pn0qW538SiNmDfymuA1PaCHx2aiFNJvOh3FQ-SqD7MI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storageKey: 'sb-zarfdxqzwlurgeosafvv-auth-token',
    // Skip Web Lock API — prevents 5s hang on page load
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn()
    },
  },
})

export type { SupabaseClient } from '@supabase/supabase-js'
