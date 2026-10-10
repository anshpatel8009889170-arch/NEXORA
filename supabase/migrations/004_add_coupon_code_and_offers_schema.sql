-- PHASE 22: OFFERS & COUPONS ENHANCEMENTS

-- 1. Ensure orders table has coupon_code column
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

-- 2. Ensure offers table has all necessary fields
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage';
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2);
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS minimum_order NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10, 2);
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS public.offers ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

-- 3. Seed / Upsert SAVE50 and Standard Offers
INSERT INTO public.offers (
  code,
  description,
  discount_type,
  discount_value,
  discount_percent,
  discount_amount,
  minimum_order,
  min_order_amount,
  max_discount,
  is_active
) VALUES 
  (
    'SAVE50',
    'Special 20% discount on gourmet fine-dining orders above ₹499 (Max discount ₹150)',
    'percentage',
    20.00,
    20.00,
    NULL,
    499.00,
    499.00,
    150.00,
    true
  ),
  (
    'WELCOME50',
    'Flat ₹50 savings on your royal order above ₹299',
    'flat',
    50.00,
    NULL,
    50.00,
    299.00,
    299.00,
    NULL,
    true
  ),
  (
    'ROYAL100',
    'Flat ₹100 savings on royal dining and party orders above ₹599',
    'flat',
    100.00,
    NULL,
    100.00,
    599.00,
    599.00,
    NULL,
    true
  ),
  (
    'FESTIVE20',
    'Festive 20% discount up to ₹200 on luxury orders above ₹499',
    'percentage',
    20.00,
    20.00,
    NULL,
    499.00,
    499.00,
    200.00,
    true
  )
ON CONFLICT (code) DO UPDATE SET 
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  discount_percent = EXCLUDED.discount_percent,
  discount_amount = EXCLUDED.discount_amount,
  minimum_order = EXCLUDED.minimum_order,
  min_order_amount = EXCLUDED.min_order_amount,
  max_discount = EXCLUDED.max_discount,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
