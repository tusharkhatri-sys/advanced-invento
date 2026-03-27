import { useSalesChart } from '../../hooks/useDashboard'
import { formatCurrency } from '../../lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function ProfitChart() {
  const { data: data30, isLoading: l30 } = useSalesChart(30)
  const { data: data7 } = useSalesChart(7)

  const total30Sales = (data30 || []).reduce((s, d) => s + d.sales, 0)
  const total30Profit = (data30 || []).reduce((s, d) => s + d.profit, 0)
  const total7Sales = (data7 || []).reduce((s, d) => s + d.sales, 0)
  const avgDaily = data30?.length ? total30Sales / data30.length : 0

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '30-Day Revenue', value: formatCurrency(total30Sales), color: 'text-brand-400' },
          { label: '30-Day Profit (Est.)', value: formatCurrency(total30Profit), color: 'text-emerald-400' },
          { label: '7-Day Revenue', value: formatCurrency(total7Sales), color: 'text-blue-400' },
          { label: 'Daily Avg Revenue', value: formatCurrency(avgDaily), color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">📈 Sales vs Profit (30 Days)</h3>
        {l30 ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !data30?.length ? (
          <p className="text-center text-gray-500 py-12 text-sm">No data yet. Start selling!</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data30}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                formatter={(v: number, n: string) => [formatCurrency(v), n === 'sales' ? 'Sales' : 'Profit']}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#gSales)" strokeWidth={2} name="Sales" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#gProfit)" strokeWidth={2} name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Line Chart - 7 day */}
      {data7 && data7.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">📊 Last 7 Days Details</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data7}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                formatter={(v: number, n: string) => [formatCurrency(v), n === 'sales' ? 'Sales' : 'Profit']}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Sales" />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
