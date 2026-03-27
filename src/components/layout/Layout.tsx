import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { useUIStore } from '../../stores/uiStore'

export default function Layout() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-y-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav - mobile only */}
      <BottomNav />
    </div>
  )
}
