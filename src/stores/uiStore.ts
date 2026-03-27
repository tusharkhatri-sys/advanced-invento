import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../types'

interface UIState {
  darkMode: boolean
  language: Language
  sidebarOpen: boolean
  toggleDarkMode: () => void
  setLanguage: (lang: Language) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      darkMode: true,
      language: 'en',
      sidebarOpen: false,

      toggleDarkMode: () => {
        const newMode = !get().darkMode
        set({ darkMode: newMode })
        if (newMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      setLanguage: (lang) => set({ language: lang }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ui-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark')
        }
      }
    }
  )
)
