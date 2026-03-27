import { useState } from 'react'
import { FileText, RefreshCw, RotateCcw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { useSales, useReturnSale } from '../../hooks/useSales'
import { formatCurrency, formatDate, formatDateForInput } from '../../lib/utils'
import { generateInvoicePDF } from '../billing/generatePDF'
import { useAuthStore } from '../../stores/authStore'
import { ConfirmModal } from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import type { Sale } from '../../types'
import toast from 'react-hot-toast'

export default function SalesReport() {
  const [from, setFrom] = useState(formatDateForInput(new Date(Date.now() - 30 * 86400000)))
  const [to, setTo] = useState(formatDateForInput())
  const [returnId, setReturnId] = useState<string | null>(null)

  const { data: sales, isLoading, refetch } = useSales({ from, to })
  const returnSale = useReturnSale()
  const { user } = useAuthStore()

  const activeSales = (sales || []).filter((s) => !s.returned)
  const totalRevenue = activeSales.reduce((s, r) => s + r.total, 0)
  const totalGST = activeSales.reduce((s, r) => s + r.gst_amount, 0)

  const chartData = activeSales.reduce<Record<string, number>>((acc, s) => {
    const date = s.date
    acc[date] = (acc[date] || 0) + s.total
    return acc
  }, {})
  const chartArr = Object.entries(chartData).map(([date, total]) => ({ date: date.slice(5), total }))

  const handleExport = () => {
    if (!activeSales.length) { toast.error('No sales to export'); return }
    const { jsPDF } = require('jspdf')
    const autoTable = require('jspdf-autotable')
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Sales Report: ${from} to ${to}`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)} | Total Bills: ${activeSales.length}`, 14, 22)
    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Bill No', 'Customer', 'Payment', 'GST', 'Total']],
      body: activeSales.map((s) => [
        formatDate(s.date),
        s.bill_no,
        s.customer_name || '—',
        (s.payment_method || '').toUpperCase(),
        formatCurrency(s.gst_amount),
        formatCurrency(s.total),
      ]),
      headStyles: { fillColor: [99, 102, 241] },
    })
    doc.save(`Sales-Report-${from}-${to}.pdf`)
    toast.success('Report exported!')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Date filter */}
      <div className="card flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">From Date</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={() => refetch()} className="btn btn-secondary"><RefreshCw size={14} /> Refresh</button>
        <button onClick={handleExport} className="btn btn-primary"><FileText size={14} /> Export PDF</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-emerald-400' },
          { label: 'Total Bills', value: String(activeSales.length), color: 'text-brand-400' },
          { label: 'Total GST', value: formatCurrency(totalGST), color: 'text-amber-400' },
          { label: 'Returns', value: String((sales || []).filter((s) => s.returned).length), color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartArr.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Daily Sales</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartArr}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }}
                formatter={(v: number) => [formatCurrency(v), 'Sales']}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sales table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : !activeSales.length ? (
          <p className="text-center text-gray-500 text-sm py-10">No sales in this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Bill No</th>
                  <th className="table-header hidden sm:table-cell">Customer</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header">Total</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(sales || []).map((s) => (
                  <tr key={s.id} className={`table-row ${s.returned ? 'opacity-50' : ''}`}>
                    <td className="table-cell text-xs text-gray-500">{formatDate(s.date)}</td>
                    <td className="table-cell font-mono text-xs text-brand-400">{s.bill_no}</td>
                    <td className="table-cell hidden sm:table-cell text-sm">{s.customer_name || '—'}</td>
                    <td className="table-cell">
                      <span className="badge badge-blue text-xs">{(s.payment_method || '').toUpperCase()}</span>
                    </td>
                    <td className="table-cell font-medium">{formatCurrency(s.total)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.returned ? (
                          <span className="badge badge-red">Returned</span>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                const doc = generateInvoicePDF(s, {
                                  name: user?.shop_name || 'My Shop',
                                  address: user?.shop_address || '',
                                  phone: user?.shop_phone || '',
                                  gstin: user?.gstin,
                                })
                                doc.save(`Invoice-${s.bill_no}.pdf`)
                              }}
                              className="btn btn-ghost btn-sm text-xs"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => setReturnId(s.id)}
                              className="btn btn-danger btn-sm text-xs"
                            >
                              <RotateCcw size={11} /> Return
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!returnId}
        onClose={() => setReturnId(null)}
        onConfirm={async () => { await returnSale.mutateAsync(returnId!); setReturnId(null) }}
        title="Process Return?"
        message="This will restore the stock for all items in this bill. Action cannot be undone."
        loading={returnSale.isPending}
      />
    </div>
  )
}
