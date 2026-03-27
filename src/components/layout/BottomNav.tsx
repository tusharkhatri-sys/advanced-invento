import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Truck, BarChart2 } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/inventory', icon: Package, label: 'Stock' },
  { to: '/billing', icon: ShoppingCart, label: 'Billing' },
  { to: '/purchases', icon: Truck, label: 'Purchase' },
  { to: '/reports/sales', icon: BarChart2, label: 'Reports' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0
              ${isActive
                ? 'text-brand-400'
                : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-brand-600/20' : ''}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium" style={{ fontSize: '10px' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
