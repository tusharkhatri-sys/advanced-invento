import { useProducts } from '../../hooks/useProducts'
import { formatCurrency, categoryLabels, getStockStatus } from '../../lib/utils'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function StockReport() {
  const { data: products, isLoading } = useProducts()

  const inStockProducts = (products || []).filter((p) => p.quantity > 0)
  const lowStockProducts = (products || []).filter(
    (p) => p.quantity > 0 && p.quantity <= p.low_stock_threshold
  )
  const outOfStock = (products || []).filter((p) => p.quantity === 0)
  const totalValue = inStockProducts.reduce((s, p) => s + p.quantity * p.buy_price, 0)
  const totalRetailValue = inStockProducts.reduce((s, p) => s + p.quantity * p.sell_price, 0)
  const potentialProfit = totalRetailValue - totalValue

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: String(products?.length || 0), color: 'text-brand-400' },
          { label: 'Stock Value (Cost)', value: formatCurrency(totalValue), color: 'text-gray-200' },
          { label: 'Retail Value', value: formatCurrency(totalRetailValue), color: 'text-emerald-400' },
          { label: 'Potential Profit', value: formatCurrency(potentialProfit), color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-base font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {lowStockProducts.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-amber-400 mb-3">⚠️ Low Stock Items ({lowStockProducts.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Stock</th>
                  <th className="table-header">Alert At</th>
                  <th className="table-header">Value</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell text-sm font-medium">{p.name}</td>
                    <td className="table-cell text-xs text-gray-500">{categoryLabels[p.category]}</td>
                    <td className="table-cell"><span className="badge badge-yellow">{p.quantity}</span></td>
                    <td className="table-cell text-xs text-gray-500">{p.low_stock_threshold}</td>
                    <td className="table-cell text-xs">{formatCurrency(p.quantity * p.buy_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {outOfStock.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-red-400 mb-3">❌ Out of Stock ({outOfStock.length})</h3>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map((p) => (
              <span key={p.id} className="badge badge-red text-xs">{p.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200">📦 Full Stock Report</h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="table-header">Product</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Cost</th>
                  <th className="table-header">MRP</th>
                  <th className="table-header">Stock Value</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {(products || []).map((p) => {
                  const status = getStockStatus(p.quantity, p.low_stock_threshold)
                  return (
                    <tr key={p.id} className="table-row">
                      <td className="table-cell text-sm font-medium">{p.name}</td>
                      <td className="table-cell text-xs text-gray-500">{categoryLabels[p.category]}</td>
                      <td className="table-cell text-center font-bold">{p.quantity}</td>
                      <td className="table-cell text-xs">{formatCurrency(p.buy_price)}</td>
                      <td className="table-cell text-xs text-emerald-400">{formatCurrency(p.sell_price)}</td>
                      <td className="table-cell text-xs font-medium">{formatCurrency(p.quantity * p.buy_price)}</td>
                      <td className="table-cell">
                        <span className={`badge ${status === 'ok' ? 'badge-green' : status === 'low' ? 'badge-yellow' : 'badge-red'}`}>
                          {status === 'ok' ? 'Good' : status === 'low' ? 'Low' : 'Out'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
