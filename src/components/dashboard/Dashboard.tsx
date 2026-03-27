import { TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { useDashboardStats, useSalesChart, useTopProducts, useLowStockProducts } from '../../hooks/useDashboard'
import { formatCurrency, categoryLabels } from '../../lib/utils'
import LoadingSpinner from '../ui/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

function StatCard({ label, value, icon: Icon, trend, color }: {
  label: string
  value: string
  icon: React.ElementType
  trend?: string
  color: string
}) {
  return (
    <div className={`stat-card group border-${color}-500/20 hover:border-${color}-500/40`}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <div className={`p-2 rounded-xl bg-${color}-500/10`}>
          <Icon size={15} className={`text-${color}-400`} />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-100 mt-1">{value}</p>
      {trend && (
        <p className="text-xs text-gray-500 mt-0.5">{trend}</p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: chartData, isLoading: chartLoading } = useSalesChart(30)
  const { data: topProducts } = useTopProducts(5)
  const { data: lowStock } = useLowStockProducts()
  const navigate = useNavigate()

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Low stock banner */}
      {lowStock && lowStock.length > 0 && (
        <div
          className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/15 transition-colors"
          onClick={() => navigate('/inventory')}
        >
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <strong>{lowStock.length} items</strong> are low on stock!
            {lowStock.slice(0, 2).map((p) => ` • ${p.name} (${p.quantity} left)`).join('')}
            {lowStock.length > 2 && ' ...'}
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(stats?.today_sales || 0)}
          icon={DollarSign}
          color="emerald"
          trend="Sales today"
        />
        <StatCard
          label="Today's Profit"
          value={formatCurrency(stats?.today_profit || 0)}
          icon={TrendingUp}
          color="brand"
          trend="Estimated"
        />
        <StatCard
          label="Monthly Sales"
          value={formatCurrency(stats?.monthly_sales || 0)}
          icon={BarChart3}
          color="blue"
          trend="This month"
        />
        <StatCard
          label="Total Products"
          value={String(stats?.total_products || 0)}
          icon={Package}
          color="purple"
          trend="In inventory"
        />
        <StatCard
          label="Low Stock Items"
          value={String(stats?.low_stock_count || 0)}
          icon={AlertTriangle}
          color="amber"
          trend="Need reorder"
        />
        <StatCard
          label="Stock Value"
          value={formatCurrency(stats?.total_stock_value || 0)}
          icon={TrendingDown}
          color="rose"
          trend="At buy price"
        />
      </div>

      {/* Sales Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-200 mb-4 text-sm">📈 Sales & Profit (Last 30 Days)</h3>
        {chartLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !chartData?.length ? (
          <p className="text-center text-gray-500 py-12 text-sm">No sales data yet. Create your first bill!</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#colorSales)" strokeWidth={2} name="Sales" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="card">
          <h3 className="font-semibold text-gray-200 mb-4 text-sm">🏆 Top Selling Products</h3>
          {!topProducts?.length ? (
            <p className="text-gray-500 text-sm text-center py-6">No sales yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                  formatter={(v: number, n: string) => [n === 'revenue' ? formatCurrency(v) : v, n === 'revenue' ? 'Revenue' : 'Units Sold']}
                />
                <Bar dataKey="qty" fill="#6366f1" radius={[0, 4, 4, 0]} name="Units" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low Stock List */}
        <div className="card">
          <h3 className="font-semibold text-gray-200 mb-4 text-sm">⚠️ Low Stock Alert</h3>
          {!lowStock?.length ? (
            <div className="flex flex-col items-center py-8">
              <span className="text-3xl mb-2">✅</span>
              <p className="text-gray-500 text-sm">All items well stocked!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-800/50">
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{categoryLabels[p.category] || p.category}</p>
                  </div>
                  <span className={`badge ${p.quantity === 0 ? 'badge-red' : 'badge-yellow'}`}>
                    {p.quantity === 0 ? 'Out of Stock' : `${p.quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
