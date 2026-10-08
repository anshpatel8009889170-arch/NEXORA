-- ============================================================================
-- NEXORA - MIGRATION 002: ADD ADDRESSES, PAYMENTS & ALIGN SCHEMA COLUMNS
-- ============================================================================

-- 1. CREATE ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read addresses" ON addresses
  FOR SELECT USING (true);

CREATE POLICY "Public insert addresses" ON addresses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update addresses" ON addresses
  FOR UPDATE USING (true);

CREATE POLICY "Public delete addresses" ON addresses
  FOR DELETE USING (true);

-- 2. CREATE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'cod',
  transaction_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Public insert payments" ON payments
  FOR INSERT WITH CHECK (true);

-- 3. ALIGN EXISTING COLUMNS ACCORDING TO PHASE 2 SCHEMA

-- Profiles: add email & avatar alias
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Categories: add image column
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;

-- Menu Items: add is_vegetarian and image alias
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT true;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image TEXT;
UPDATE menu_items SET is_vegetarian = is_veg WHERE is_vegetarian IS NULL;
UPDATE menu_items SET image = image_url WHERE image IS NULL;

-- Orders: add order_type & total alias
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total NUMERIC(10, 2);
UPDATE orders SET total = total_amount WHERE total IS NULL;
UPDATE orders SET order_type = delivery_type::text WHERE order_type IS NULL;

-- Order Items: add unit_price & total_price alias
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price NUMERIC(10, 2);
UPDATE order_items SET unit_price = price WHERE unit_price IS NULL;
UPDATE order_items SET total_price = item_total WHERE total_price IS NULL;

-- Offers: add discount_type, discount_value, minimum_order, max_discount, start_date, end_date
ALTER TABLE offers ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10, 2);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS minimum_order NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS max_discount NUMERIC(10, 2);
ALTER TABLE offers ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE offers ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
UPDATE offers SET minimum_order = min_order_amount WHERE minimum_order = 0 AND min_order_amount IS NOT NULL;
UPDATE offers SET discount_value = COALESCE(discount_percent, discount_amount) WHERE discount_value IS NULL;

-- Reviews: add order_id
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
