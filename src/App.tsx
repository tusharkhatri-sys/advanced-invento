import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { useUIStore } from './stores/uiStore'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Lazy load ALL pages — only loads code when user actually visits that page
const LoginPage = lazy(() => import('./components/auth/LoginPage'))
const Layout = lazy(() => import('./components/layout/Layout'))
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'))
const InventoryList = lazy(() => import('./components/inventory/InventoryList'))
const BillingPOS = lazy(() => import('./components/billing/BillingPOS'))
const PurchaseList = lazy(() => import('./components/purchases/PurchaseList'))
const SalesReport = lazy(() => import('./components/reports/SalesReport'))
const StockReport = lazy(() => import('./components/reports/StockReport'))
const ProfitChart = lazy(() => import('./components/reports/ProfitChart'))
const SupplierList = lazy(() => import('./components/suppliers/SupplierList'))
const SettingsPage = lazy(() => import('./components/settings/SettingsPage'))
const ExpenseTracker = lazy(() => import('./components/expenses/ExpenseTracker'))
const CreditBook = lazy(() => import('./components/credits/CreditBook'))
const DealerList = lazy(() => import('./components/dealers/DealerList'))
const CustomerList = lazy(() => import('./components/customers/CustomerList'))
const ReturnsPage = lazy(() => import('./components/returns/ReturnsPage'))
const DamagedStock = lazy(() => import('./components/inventory/DamagedStock'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <LoadingSpinner size={24} />
  </div>
)

function App() {
  const { user, setUser, fetchProfile } = useAuthStore()
  const { darkMode } = useUIStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    let cancelled = false

    // Fast timeout — if Supabase takes >2s, show login anyway
    const timeout = setTimeout(() => {
      if (!cancelled && initializing) {
        setInitializing(false)
      }
    }, 2000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (!cancelled) setInitializing(false)
        })
      } else {
        setUser(null)
        setInitializing(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setUser(null)
        setInitializing(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-900/50">
            <span className="text-xl">📦</span>
          </div>
          <LoadingSpinner className="mt-2 mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<InventoryList />} />
            <Route path="billing" element={<BillingPOS />} />
            <Route path="purchases" element={<PurchaseList />} />
            <Route path="reports/sales" element={<SalesReport />} />
            <Route path="reports/stock" element={<StockReport />} />
            <Route path="reports/profit" element={<ProfitChart />} />
            <Route path="suppliers" element={<SupplierList />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="expenses" element={<ExpenseTracker />} />
            <Route path="credits" element={<CreditBook />} />
            <Route path="dealers" element={<DealerList />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="inventory/damaged" element={<DamagedStock />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
