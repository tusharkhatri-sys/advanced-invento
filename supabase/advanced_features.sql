-- ============================================================
-- WHOLESALE FEATURES - Run after main schema.sql
-- ============================================================

-- 1. Add wholesale columns to products
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS wholesale_price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_wholesale_qty integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS box_size integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'piece' CHECK (unit IN ('piece','box','dozen','set','pair'));



-- 2. DEALERS / CUSTOMERS TABLE (regular buyers)
CREATE TABLE IF NOT EXISTS public.dealers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  business_name text,
  phone text NOT NULL,
  address text,
  gstin text,
  credit_limit numeric(10,2) DEFAULT 0,
  outstanding_balance numeric(10,2) DEFAULT 0,
  price_tier text DEFAULT 'wholesale' CHECK (price_tier IN ('retail','wholesale','super_wholesale')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealers_name_idx ON public.dealers(name);
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD dealers" ON public.dealers FOR ALL USING (auth.role() = 'authenticated');

-- 3. CHALLANS (Delivery Notes)
CREATE TABLE IF NOT EXISTS public.challans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challan_no text NOT NULL UNIQUE,
  dealer_id uuid REFERENCES public.dealers(id) ON DELETE SET NULL,
  dealer_name text,
  items jsonb DEFAULT '[]'::jsonb,
  total_qty integer DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','invoiced','cancelled')),
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  transport_name text,
  vehicle_no text,
  lr_no text,
  notes text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.challans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD challans" ON public.challans FOR ALL USING (auth.role() = 'authenticated');

-- 4. EXPENSES TABLE (if not already created)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('rent','salary','electricity','transport','packaging','food','maintenance','other')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  date date DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash','upi','card')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Auth users can CRUD expenses" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');

-- 5. CREDITS / UDHAR TABLE (if not already created)
CREATE TABLE IF NOT EXISTS public.credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  phone text,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','partial','paid')),
  notes text,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Auth users can CRUD credits" ON public.credits FOR ALL USING (auth.role() = 'authenticated');

-- 6. Add dealer_id to sales for tracking wholesale orders
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS dealer_id uuid REFERENCES public.dealers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS challan_id uuid REFERENCES public.challans(id) ON DELETE SET NULL;

-- 7. CUSTOMERS TABLE (Retail CRM)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  address text,
  total_purchases integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  outstanding_balance numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
-- 8. DAMAGED / DEAD STOCK
CREATE TABLE IF NOT EXISTS public.damaged_stock (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  qty integer NOT NULL CHECK (qty > 0),
  reason text NOT NULL,
  buy_price numeric(10,2) DEFAULT 0,
  loss_amount numeric(10,2) GENERATED ALWAYS AS (qty * buy_price) STORED,
  date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.damaged_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD damaged_stock" ON public.damaged_stock FOR ALL USING (auth.role() = 'authenticated');
