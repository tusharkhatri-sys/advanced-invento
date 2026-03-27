// All TypeScript interfaces for Advanced Invento

export type Category = 'charger' | 'case' | 'earphone' | 'screen_guard' | 'cable' | 'powerbank' | 'battery' | 'other';
export type PaymentMethod = 'cash' | 'upi' | 'card';
export type Language = 'en' | 'hi';

export interface Product {
  id: string;
  name: string;
  category: Category;
  imei_serial?: string;
  barcode?: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  godown_quantity?: number;
  wholesale_price?: number;
  min_wholesale_qty?: number;
  unit?: string;
  box_size?: number;
  low_stock_threshold: number;
  image_url?: string;
  gst_rate: number; // 0, 5, 12, 18, 28
  hsn_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  gstin?: string;
  created_at: string;
}

export interface Purchase {
  id: string;
  product_id: string;
  product?: Product;
  supplier_id?: string;
  supplier?: Supplier;
  qty: number;
  rate: number;
  total: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  qty: number;
  sell_price: number;
  gst_rate: number;
  discount: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  total_purchases: number;
  total_spent: number;
  outstanding_balance: number;
  notes?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  bill_no: string;
  customer_name?: string;
  phone?: string;
  dealer_id?: string;
  challan_id?: string;
  items: SaleItem[];
  subtotal: number;
  gst_amount: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  is_inter_state: boolean;
  returned: boolean;
  date: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  discount: number;
  unit_price: number;
}

export interface DashboardStats {
  today_sales: number;
  today_profit: number;
  total_products: number;
  low_stock_count: number;
  monthly_sales: number;
  total_stock_value: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
  profit: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  shop_name?: string;
  shop_address?: string;
  shop_phone?: string;
  gstin?: string;
  role: 'owner' | 'admin';
  created_at: string;
}

export interface GSTBreakup {
  cgst: number;
  sgst: number;
  igst: number;
  rate: number;
}

export interface DamagedStock {
  id: string;
  product_id: string;
  product?: Product;
  qty: number;
  reason: string;
  buy_price: number;
  date: string;
  notes?: string;
  created_at: string;
}
