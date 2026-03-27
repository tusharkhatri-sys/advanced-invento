-- ============================================================
-- ADVANCED INVENTO - Complete Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  shop_name text DEFAULT 'My Mobile Shop',
  shop_address text DEFAULT 'Jodhpur, Rajasthan',
  shop_phone text,
  gstin text,
  role text DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, shop_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Owner'),
    'My Mobile Shop',
    'owner'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text DEFAULT 'other' CHECK (category IN ('charger','case','earphone','screen_guard','cable','powerbank','other')),
  imei_serial text,
  barcode text,
  buy_price numeric(10,2) DEFAULT 0,
  sell_price numeric(10,2) DEFAULT 0,
  quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  gst_rate numeric(5,2) DEFAULT 18,
  hsn_code text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_barcode_idx ON public.products(barcode);
CREATE INDEX IF NOT EXISTS products_name_idx ON public.products USING gin(to_tsvector('english', name));

-- 3. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  gstin text,
  created_at timestamptz DEFAULT now()
);

-- 4. PURCHASES
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1,
  rate numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) GENERATED ALWAYS AS (qty * rate) STORED,
  date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. SALES
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_no text NOT NULL UNIQUE,
  customer_name text,
  phone text,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) DEFAULT 0,
  gst_amount numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash','upi','card')),
  is_inter_state boolean DEFAULT false,
  returned boolean DEFAULT false,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_date_idx ON public.sales(date);
CREATE INDEX IF NOT EXISTS sales_bill_no_idx ON public.sales(bill_no);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Products: any authenticated user can CRUD
CREATE POLICY "Auth users can select products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

-- Suppliers: any authenticated user
CREATE POLICY "Auth users can CRUD suppliers" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');

-- Purchases: any authenticated user
CREATE POLICY "Auth users can CRUD purchases" ON public.purchases FOR ALL USING (auth.role() = 'authenticated');

-- Sales: any authenticated user
CREATE POLICY "Auth users can CRUD sales" ON public.sales FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA: 20 Sample Products for Mobile Accessories Shop
-- ============================================================

INSERT INTO public.products (name, category, buy_price, sell_price, quantity, low_stock_threshold, gst_rate, hsn_code, barcode) VALUES
  -- Chargers (5 products)
  ('Samsung 25W Fast Charger (Type-C)', 'charger', 120, 249, 25, 5, 18, '8504', 'SAM-25W-TC'),
  ('Apple 20W USB-C Power Adapter', 'charger', 180, 349, 15, 3, 18, '8504', 'APL-20W-UC'),
  ('Boat 65W GaN Fast Charger', 'charger', 250, 499, 10, 3, 18, '8504', 'BOA-65W-GAN'),
  ('Realme 33W Dart Charger', 'charger', 90, 199, 30, 5, 18, '8504', 'RLM-33W-DT'),
  ('Mi 33W Combo Charger + Cable', 'charger', 130, 279, 20, 5, 18, '8504', 'MI-33W-CB'),

  -- Mobile Cases (5 products)  
  ('iPhone 15 Transparent Case', 'case', 50, 149, 40, 10, 12, '3926', 'IPH-15-TR'),
  ('Samsung S24 Leather Back Cover', 'case', 80, 199, 30, 8, 12, '3926', 'SAM-S24-LTH'),
  ('Redmi Note 13 Shockproof Cover', 'case', 40, 99, 50, 15, 12, '3926', 'RDM-N13-SC'),
  ('OnePlus 12 Flip Cover Wallet', 'case', 100, 249, 20, 5, 12, '3926', 'OP-12-FC'),
  ('Universal Silicone Case (6.1–6.7 inch)', 'case', 30, 79, 60, 20, 12, '3926', 'UNI-SIL-UC'),

  -- Earphones (3 products)
  ('boAt BassHeads 100 Earphones', 'earphone', 100, 249, 20, 5, 18, '8518', 'BOA-BH-100'),
  ('JBL C50HI In-Ear Headphones', 'earphone', 200, 449, 10, 3, 18, '8518', 'JBL-C50HI'),
  ('Realme Buds Wireless 2 TWS', 'earphone', 350, 699, 8, 2, 18, '8518', 'RLM-BW2-TWS'),

  -- Screen Guards (3 products)
  ('iPhone 15 Tempered Glass (Pack of 2)', 'screen_guard', 30, 89, 60, 15, 18, '7007', 'IPH-15-TG2'),
  ('Samsung S24 Privacy 9H Glass', 'screen_guard', 50, 129, 45, 10, 18, '7007', 'SAM-S24-PV'),
  ('Universal HD Clear Screen Protector', 'screen_guard', 20, 59, 80, 20, 18, '7007', 'UNI-HD-SP'),

  -- Cables (2 products)
  ('Realme 65W VOOC Type-C Cable 1m', 'cable', 60, 149, 35, 10, 18, '8544', 'RLM-65W-C1'),
  ('iPhone Lightning to USB-C Cable 1.5m', 'cable', 80, 199, 25, 8, 18, '8544', 'APL-LTC-15'),

  -- Power Banks (2 products)
  ('Mi Power Bank 10000mAh 22.5W', 'powerbank', 600, 999, 8, 2, 18, '8507', 'MI-PB-10K'),
  ('Ambrane 20000mAh PD Power Bank', 'powerbank', 900, 1499, 5, 2, 18, '8507', 'AMB-PB-20K')
ON CONFLICT DO NOTHING;
