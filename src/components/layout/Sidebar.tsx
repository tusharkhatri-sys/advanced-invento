import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, TrendingUp,
  Truck, BarChart2, Users, LogOut, X, Store, Settings,
  Wallet, IndianRupee, UserCheck, RotateCcw, PackageMinus
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/inventory/damaged', icon: PackageMinus, label: 'Damaged Stock' },
  { to: '/billing', icon: ShoppingCart, label: 'Billing / POS' },
  { to: '/returns', icon: RotateCcw, label: 'Returns' },
  { to: '/purchases', icon: Truck, label: 'Purchases' },
  { to: '/dealers', icon: UserCheck, label: 'Dealers' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/credits', icon: IndianRupee, label: 'Udhar Book' },
  { to: '/expenses', icon: Wallet, label: 'Expenses' },
  { to: '/suppliers', icon: Users, label: 'Suppliers' },
]

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col
        bg-gray-900 border-r border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/50">
            <Store size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">
              {user?.shop_name || 'My Shop'}
            </h1>
            <p className="text-xs text-gray-500">Advanced Invento</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-800 text-gray-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {/* Reports sub-nav */}
        <div className="pt-2">
          <p className="text-xs text-gray-600 uppercase tracking-wider px-3 pb-1">Reports</p>
          {[
            { to: '/reports/sales', label: '📊 Sales Report' },
            { to: '/reports/stock', label: '📦 Stock Report' },
            { to: '/reports/profit', label: '💰 Profit & Loss' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${isActive
                  ? 'bg-brand-600/20 text-brand-300'
                  : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Settings link */}
        <div className="pt-2">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`
            }
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </div>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/50 mb-2">
          <div className="w-7 h-7 bg-brand-600/30 rounded-lg flex items-center justify-center">
            <span className="text-brand-400 text-xs font-bold">
              {(user?.full_name || user?.email || 'O').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">
              {user?.full_name || 'Owner'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}
