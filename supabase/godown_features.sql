-- ============================================================
-- GODOWN / WAREHOUSE FEATURES
-- Run after advanced_features.sql
-- ============================================================

-- 1. Add godown column to products
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS godown_quantity integer DEFAULT 0;

-- 2. Auto Stock Transfer RPC Function
-- This moves stock between 'Shop' (quantity) and 'Godown' (godown_quantity)
CREATE OR REPLACE FUNCTION transfer_stock(p_id uuid, qty integer, from_godown boolean)
RETURNS void AS $$
BEGIN
  IF from_godown THEN
    -- Move from Godown to Shop
    UPDATE public.products 
    SET quantity = quantity + qty, 
        godown_quantity = godown_quantity - qty 
    WHERE id = p_id AND godown_quantity >= qty;
  ELSE
    -- Move from Shop to Godown
    UPDATE public.products 
    SET quantity = quantity - qty, 
        godown_quantity = godown_quantity + qty 
    WHERE id = p_id AND quantity >= qty;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
