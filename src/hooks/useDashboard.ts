import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DashboardStats, SalesChartData } from '../types'

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0]

      // Single parallel fetch - minimal columns only
      const [todaySalesRes, productsRes, monthSalesRes] = await Promise.all([
        supabase
          .from('sales')
          .select('total, subtotal, gst_amount')
          .eq('date', today)
          .eq('returned', false),
        supabase.from('products').select('quantity, buy_price, low_stock_threshold'),
        supabase
          .from('sales')
          .select('total')
          .gte('date', monthStart)
          .eq('returned', false),
      ])

      const todaySales = (todaySalesRes.data || []).reduce((s, r) => s + r.total, 0)
      const todayProfit = (todaySalesRes.data || []).reduce((s, r) =>
        s + (r.total - (r.gst_amount || 0)), 0)

      const products = productsRes.data || []
      const totalProducts = products.length
      const lowStockCount = products.filter(
        (p) => p.quantity <= p.low_stock_threshold
      ).length
      const totalStockValue = products.reduce((s, p) => s + p.quantity * p.buy_price, 0)
      const monthlySales = (monthSalesRes.data || []).reduce((s, r) => s + r.total, 0)

      return {
        today_sales: todaySales,
        today_profit: todayProfit,
        total_products: totalProducts,
        low_stock_count: lowStockCount,
        monthly_sales: monthlySales,
        total_stock_value: totalStockValue,
      }
    },
    staleTime: 1000 * 60 * 5,    // 5 min - don't refetch too often
    gcTime: 1000 * 60 * 10,
    refetchInterval: 60000,       // refresh every 60s (was 30s)
    placeholderData: (prev) => prev,
  })
}

export const useSalesChart = (days = 30) => {
  return useQuery({
    queryKey: ['dashboard', 'chart', days],
    queryFn: async (): Promise<SalesChartData[]> => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('sales')
        .select('date, total, gst_amount')
        .gte('date', startDate.toISOString().split('T')[0])
        .eq('returned', false)
        .order('date')

      if (error) throw error

      const grouped: Record<string, { sales: number; profit: number }> = {}
      ;(data || []).forEach((s) => {
        if (!grouped[s.date]) grouped[s.date] = { sales: 0, profit: 0 }
        grouped[s.date].sales += s.total
        grouped[s.date].profit += s.total - (s.gst_amount || 0)
      })

      return Object.entries(grouped).map(([date, vals]) => ({
        date,
        sales: Math.round(vals.sales),
        profit: Math.round(vals.profit),
      }))
    },
    staleTime: 1000 * 60 * 10,  // 10 min stale for charts
    gcTime: 1000 * 60 * 15,
    placeholderData: (prev) => prev,
  })
}

export const useTopProducts = (limit = 5) => {
  return useQuery({
    queryKey: ['dashboard', 'top-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('items')
        .eq('returned', false)
        .limit(200)  // Reduced from 500

      if (error) throw error

      const counts: Record<string, { name: string; qty: number; revenue: number }> = {}
      ;(data || []).forEach((sale) => {
        const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || [])
        items.forEach((item: { product_id: string; product_name: string; qty: number; sell_price: number }) => {
          if (!counts[item.product_id]) {
            counts[item.product_id] = { name: item.product_name, qty: 0, revenue: 0 }
          }
          counts[item.product_id].qty += item.qty
          counts[item.product_id].revenue += item.qty * item.sell_price
        })
      })

      return Object.entries(counts)
        .map(([id, vals]) => ({ id, ...vals }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limit)
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
    placeholderData: (prev) => prev,
  })
}

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, quantity, low_stock_threshold')
        .order('quantity')
        .limit(20)

      if (error) throw error

      return (data || []).filter(
        (p) => p.quantity <= p.low_stock_threshold
      )
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 120000,  // Every 2 min (was 1 min)
    placeholderData: (prev) => prev,
  })
}
