import { useLocation } from 'react-router-dom'
import { Menu, Sun, Moon, Globe } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

const routeTitles: Record<string, string> = {
  '/dashboard': '📊 Dashboard',
  '/inventory': '📦 Inventory',
  '/billing': '🧾 Billing / POS',
  '/purchases': '🚚 Purchases',
  '/reports/sales': '📈 Sales Report',
  '/reports/stock': '📦 Stock Report',
  '/reports/profit': '💰 Profit & Loss',
  '/suppliers': '👥 Suppliers',
}

export default function Header() {
  const { toggleSidebar, toggleDarkMode, darkMode, language, setLanguage } = useUIStore()
  const { pathname } = useLocation()
  const title = routeTitles[pathname] || 'Advanced Invento'

  return (
    <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h2 className="font-semibold text-gray-100 text-base">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-300 transition-colors"
        >
          <Globe size={13} />
          {language === 'en' ? 'हिंदी' : 'English'}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
