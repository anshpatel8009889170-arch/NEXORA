-- ==============================================================================
-- NEXORA RESTAURANT PLATFORM — CONSOLIDATED MIGRATIONS (001 - 008)
-- Location: Sathigva, Amauli-Fatehpur Road, 212631
-- Pure-Vegetarian Fine Dining Platform Schema & RBAC Policies
-- Generated automatically on: 2026-10-11T08:32:06.352Z
-- ==============================================================================


-- ==============================================================================
-- MIGRATION: 001_initial_schema.sql
-- ==============================================================================

-- ============================================================================
-- NEXORA LUXURY RESTAURANT - COMPLETE DATABASE SCHEMA
-- LEVEL 2: Database, Tables, Relationships, RLS Policies, Storage & Seed Data
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & CUSTOM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cod', 'upi', 'online', 'card');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_type AS ENUM ('delivery', 'dine_in', 'takeaway');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE spice_level AS ENUM ('mild', 'medium', 'spicy', 'extra_spicy');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES

-- A. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  discount_price NUMERIC(10, 2),
  image_url TEXT NOT NULL,
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  spice_level spice_level DEFAULT 'medium',
  prep_time_minutes INT DEFAULT 20,
  calories INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. CUSTOMER PROFILES (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'customer',
  avatar_url TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_type delivery_type DEFAULT 'delivery',
  delivery_address TEXT,
  status order_status DEFAULT 'pending',
  payment_method payment_method DEFAULT 'cod',
  payment_status payment_status DEFAULT 'pending',
  subtotal NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) DEFAULT 0,
  delivery_fee NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- E. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  item_total NUMERIC(10, 2) NOT NULL
);

-- F. OFFERS & COUPONS
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  discount_percent NUMERIC(5, 2),
  discount_amount NUMERIC(10, 2),
  min_order_amount NUMERIC(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- G. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- H. TABLE RESERVATIONS
CREATE TABLE IF NOT EXISTS table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  guest_count INT NOT NULL CHECK (guest_count > 0),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_reservations ENABLE ROW LEVEL SECURITY;

-- Categories & Menu Items: Anyone can read active dishes
CREATE POLICY "Public read active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read available menu items" ON menu_items
  FOR SELECT USING (is_available = true);

-- Orders: Anyone can create order (guest checkout), customer can view their order
CREATE POLICY "Public can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
  );

CREATE POLICY "Public can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read order items" ON order_items
  FOR SELECT USING (true);

-- Offers: Public can view active offers
CREATE POLICY "Public read active offers" ON offers
  FOR SELECT USING (is_active = true);

-- Reviews: Public read approved reviews, customers can add review
CREATE POLICY "Public read approved reviews" ON reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Public insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Reservations: Public can create table reservation
CREATE POLICY "Public insert reservations" ON table_reservations
  FOR INSERT WITH CHECK (true);

-- Profiles: Users can read and update own profile
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. STORAGE BUCKET FOR DISH PHOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access to Menu Images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu-images');

-- 7. LUXURY SEED DATA (CATEGORIES & SIGNATURE DISHES)
INSERT INTO categories (id, name, slug, description, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Royal Starters', 'royal-starters', 'Handcrafted royal appetizers and charcoal-smoked delicacies', 1),
  ('22222222-2222-2222-2222-222222222222', 'Signature Mains', 'signature-mains', 'Curated master chef special gravies, aromatic biryanis & grills', 2),
  ('33333333-3333-3333-3333-333333333333', 'Woodfire Pizzas', 'woodfire-pizzas', 'San Marzano tomatoes, fresh buffalo mozzarella & Italian crust', 3),
  ('44444444-4444-4444-4444-444444444444', 'Artisanal Desserts', 'artisanal-desserts', 'Exquisite golden confectionery and velvet culinary finales', 4),
  ('55555555-5555-5555-5555-555555555555', 'Elixirs & Mocktails', 'elixirs-mocktails', 'Infused luxury elixirs, chilled botanicals & royal shakes', 5)
ON CONFLICT (slug) DO NOTHING;

-- SEED MENU ITEMS
INSERT INTO menu_items (category_id, name, slug, description, price, discount_price, image_url, is_veg, is_featured, spice_level, prep_time_minutes, calories) VALUES
  -- Starters
  ('11111111-1111-1111-1111-111111111111', 'Truffle Malai Paneer Tikka', 'truffle-malai-paneer-tikka', 'Cottage cheese marinated in rich cashew cream, green cardamom, smoked on clay oven and drizzled with white truffle essence.', 490.00, 440.00, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80', true, true, 'mild', 18, 380),
  ('11111111-1111-1111-1111-111111111111', 'Zafrani Murgh Seekh Kebab', 'zafrani-murgh-seekh-kebab', 'Hand-minced chicken infused with saffron threads, crushed pepper, melted ghee, served with mint emulsion.', 560.00, NULL, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', false, true, 'medium', 20, 420),
  ('11111111-1111-1111-1111-111111111111', 'Crispy Lotus Stem Honey Chilli', 'crispy-lotus-stem-honey-chilli', 'Thinly sliced lotus root crisp tossed in mountain honey, kashmiri chilli glaze and toasted sesame.', 420.00, NULL, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', true, false, 'spicy', 15, 310),

  -- Signature Mains
  ('22222222-2222-2222-2222-222222222222', 'NEXORA Royal Dal Bukhara', 'nexora-royal-dal-bukhara', 'Black lentils slow-cooked overnight over gentle charcoal embers with fresh cream, churned butter & sun-ripened tomatoes.', 520.00, 470.00, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80', true, true, 'mild', 25, 460),
  ('22222222-2222-2222-2222-222222222222', 'Old Delhi Butter Chicken Grand Cru', 'butter-chicken-grand-cru', 'Smoked succulent tandoori chicken simmered in a velvety makhani gravy finished with fenugreek and raw honey.', 640.00, 580.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80', false, true, 'mild', 25, 590),
  ('22222222-2222-2222-2222-222222222222', 'Dum Gosht Awadhi Biryani', 'dum-gosht-awadhi-biryani', 'Aged long-grain basmati rice layered with tender mutton cuts, saffron milk, sealed in earthen pot and slow cooked on dum.', 720.00, NULL, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', false, true, 'spicy', 30, 680),
  ('22222222-2222-2222-2222-222222222222', 'Paneer Lababdar Aur Khoya', 'paneer-lababdar-aur-khoya', 'Diced cottage cheese steeped in rich onion-tomato gravy with grated khoya and artisanal spices.', 510.00, NULL, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80', true, false, 'medium', 20, 490),

  -- Woodfire Pizzas
  ('33333333-3333-3333-3333-333333333333', 'Burrata & Truffle Funghi Pizza', 'burrata-truffle-funghi-pizza', 'Handcrafted 48h fermented sourdough crust, San Marzano marinara, wild forest mushrooms, crowned with fresh creamy burrata.', 680.00, 610.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', true, true, 'mild', 20, 720),
  ('33333333-3333-3333-3333-333333333333', 'Woodfire Pepperoni & Hot Honey', 'woodfire-pepperoni-hot-honey', 'Thin crispy crust with spiced Italian pepperoni, crushed San Marzano tomatoes, mozzarella, finished with house hot honey.', 740.00, NULL, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80', false, true, 'spicy', 20, 790),

  -- Desserts
  ('44444444-4444-4444-4444-444444444444', '24K Gold Leaf Saffron Shahi Tukda', '24k-gold-saffron-shahi-tukda', 'Royal ghee-fried brioche steeped in saffron rabdi, garnished with pistachios and pure 24-karat edible gold foil.', 380.00, 320.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', true, true, 'mild', 12, 340),
  ('44444444-4444-4444-4444-444444444444', 'Belgian Dark Truffle Fondant', 'belgian-dark-truffle-fondant', 'Molten 70% Single Origin chocolate cake with a warm flowing centre, served with vanilla bean gelato.', 420.00, NULL, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', true, false, 'mild', 15, 480),

  -- Beverages
  ('55555555-5555-5555-5555-555555555555', 'Smoked Rose & Berry Royale', 'smoked-rose-berry-royale', 'Wild berries muddled with organic Damascus rose reduction, sparkling tonic, served over crystal ice with applewood smoke.', 290.00, 250.00, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', true, true, 'mild', 8, 160),
  ('55555555-5555-5555-5555-555555555555', 'Saffron Cardamom Cold Brew Latte', 'saffron-cardamom-cold-brew', 'Monsooned Malabar Arabica slow-steeped for 20 hours with crushed green cardamom, topped with saffron cold foam.', 310.00, NULL, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80', true, false, 'mild', 8, 180)
ON CONFLICT (slug) DO NOTHING;

-- SEED INITIAL OFFER CODE
INSERT INTO offers (code, description, discount_percent, min_order_amount) VALUES
  ('NEXORA50', 'Welcome offer: 50% flat discount up to ₹200 on your first royal order', 50.00, 399.00),
  ('ROYAL100', 'Flat ₹100 OFF on orders above ₹799', NULL, 799.00)
ON CONFLICT (code) DO NOTHING;


-- ==============================================================================
-- MIGRATION: 002_add_addresses_payments_align_schema.sql
-- ==============================================================================

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


-- ==============================================================================
-- MIGRATION: 003_complete_rls_security.sql
-- ==============================================================================

-- ============================================================================
-- NEXORA - PHASE 3: DATABASE SECURITY (ROW LEVEL SECURITY & AUTHORIZATION)
-- ============================================================================

-- 1. HELPER FUNCTION TO CHECK IF CURRENT USER IS ADMIN OR STAFF
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Allow service role (backend API)
    current_setting('role', true) = 'service_role' OR
    -- Check admin or staff in profiles
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role),
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ENABLE RLS ON ALL 9 TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. CLEAN OLD POLICIES TO AVOID DUPLICATES
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- 5. DEFINE GRANULAR POLICIES FOR EACH TABLE
-- ============================================================================

-- A. PROFILES
-- Public: Cannot read profiles
-- Customer: Can read and update only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admin full manage profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- B. CATEGORIES
-- Public: Can read active categories
CREATE POLICY "Public read active categories" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());

-- Admin: Can insert, update, delete categories
CREATE POLICY "Admin manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- C. MENU ITEMS
-- Public: Can read available dishes
CREATE POLICY "Public read available menu items" ON public.menu_items
  FOR SELECT USING (is_available = true OR public.is_admin());

-- Admin: Full control over menu
CREATE POLICY "Admin manage menu items" ON public.menu_items
  FOR ALL USING (public.is_admin());

-- D. ORDERS
-- Anyone/Guest: Can place a new order
CREATE POLICY "Anyone can place order" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Customer: Can view only their own orders
-- Admin: Can view and update all orders
CREATE POLICY "Customers view own orders, Admin view all" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_admin()
  );

CREATE POLICY "Admin manage orders" ON public.orders
  FOR UPDATE USING (public.is_admin());

-- E. ORDER ITEMS
CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers view own order items, Admin view all" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

-- F. ADDRESSES
-- Customer: Can manage only their own addresses
CREATE POLICY "Users view own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users insert own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users update own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users delete own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- G. PAYMENTS
-- Customer: Can view payments for their own orders
-- Admin: Full access
CREATE POLICY "View own payments or admin" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = payments.order_id 
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Anyone can record payment" ON public.payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin manage payments" ON public.payments
  FOR UPDATE USING (public.is_admin());

-- H. OFFERS & COUPONS
-- Public: Can view active offers
CREATE POLICY "Public read active offers" ON public.offers
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin manage offers" ON public.offers
  FOR ALL USING (public.is_admin());

-- I. REVIEWS
-- Public: Can read approved reviews
CREATE POLICY "Public read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true OR public.is_admin());

CREATE POLICY "Customer can submit review" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin manage reviews" ON public.reviews
  FOR ALL USING (public.is_admin());

-- 6. STORAGE BUCKET POLICIES (menu-images)
CREATE POLICY "Public view menu images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Admin upload menu images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

CREATE POLICY "Admin delete menu images" ON storage.objects
  FOR DELETE USING (bucket_id = 'menu-images' AND public.is_admin());


-- ==============================================================================
-- MIGRATION: 004_add_coupon_code_and_offers_schema.sql
-- ==============================================================================

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


-- ==============================================================================
-- MIGRATION: 005_add_restaurant_settings.sql
-- ==============================================================================

-- PHASE 23: RESTAURANT SETTINGS SCHEMA
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'NEXORA Fine Dining',
  phone TEXT DEFAULT '+91 83038 90056',
  phone_secondary TEXT DEFAULT '+91 91204 89210',
  email TEXT DEFAULT 'vaibhavpatel8543@gmail.com',
  address TEXT DEFAULT 'Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra',
  opening_hours TEXT DEFAULT '11:00 AM – 11:30 PM (Mon – Sun)',
  delivery_radius TEXT DEFAULT '15 km',
  minimum_order NUMERIC(10, 2) DEFAULT 199.00,
  delivery_fee NUMERIC(10, 2) DEFAULT 40.00,
  tax_percent NUMERIC(5, 2) DEFAULT 5.00,
  social_links JSONB DEFAULT '{"instagram":"https://instagram.com","whatsapp":"https://wa.me/918303890056","facebook":"https://facebook.com","google_maps":"https://maps.google.com"}'::jsonb,
  logo_url TEXT DEFAULT '/logo.png',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Public can read restaurant settings
CREATE POLICY "Public read restaurant_settings" ON public.restaurant_settings
  FOR SELECT USING (true);

-- Admin can manage restaurant settings
CREATE POLICY "Admin update restaurant_settings" ON public.restaurant_settings
  FOR ALL USING (public.is_admin());

-- Seed initial row
INSERT INTO public.restaurant_settings (
  id,
  name,
  phone,
  phone_secondary,
  email,
  address,
  opening_hours,
  delivery_radius,
  minimum_order,
  delivery_fee,
  tax_percent,
  social_links,
  logo_url
) VALUES (
  'default',
  'NEXORA Fine Dining',
  '+91 83038 90056',
  '+91 91204 89210',
  'vaibhavpatel8543@gmail.com',
  'Sathigva, Amauli-Fatehpur Road, Near Ankit Internet Cafe And Janseva Kendra',
  '11:00 AM – 11:30 PM (Mon – Sun)',
  '15 km',
  199.00,
  40.00,
  5.00,
  '{"instagram":"https://instagram.com","whatsapp":"https://wa.me/918303890056","facebook":"https://facebook.com","google_maps":"https://maps.google.com"}'::jsonb,
  '/logo.png'
)
ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- MIGRATION: 006_reviews_enhancements.sql
-- ==============================================================================

-- ============================================================================
-- NEXORA - MIGRATION 006: REVIEWS ENHANCEMENTS (PHASE 25)
-- ============================================================================

-- 1. Allow general order & patron reviews where menu_item_id is optional
ALTER TABLE public.reviews ALTER COLUMN menu_item_id DROP NOT NULL;

-- 2. Add dish_name if patron reviewed a specific dish or overall experience
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS dish_name TEXT;

-- 3. Set default is_approved to FALSE for newly submitted customer reviews
ALTER TABLE public.reviews ALTER COLUMN is_approved SET DEFAULT false;

-- 4. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies if existing to avoid conflicts
DROP POLICY IF EXISTS "Public read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customer can submit review" ON public.reviews;
DROP POLICY IF EXISTS "Admin manage reviews" ON public.reviews;

-- 6. Public can read ONLY approved reviews (or admin can read all)
CREATE POLICY "Public read approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true OR (auth.role() = 'authenticated' AND public.is_admin()));

-- 7. Any customer / guest can submit review (awaits admin moderation)
CREATE POLICY "Customer can submit review" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- 8. Admin full moderation (approve, hide, delete)
CREATE POLICY "Admin manage reviews" ON public.reviews
  FOR ALL USING (auth.role() = 'authenticated' AND public.is_admin());


-- ==============================================================================
-- MIGRATION: 007_consolidated_security_and_rls.sql
-- ==============================================================================

-- ============================================================================
-- NEXORA - MIGRATION 007: CONSOLIDATED PRODUCTION SECURITY & ROW LEVEL SECURITY (RLS)
-- Phase 27 Enterprise Hardening
-- ============================================================================

-- 1. HARDENED ADMIN VERIFICATION FUNCTION
-- Checks service_role, profile role ('admin', 'staff', 'owner'), or administrative JWT claims.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_email TEXT;
BEGIN
  -- Service role always has unrestricted administrative access
  IF current_setting('role', true) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Check authenticated user claims
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check user metadata or email in JWT
  v_email := auth.jwt() ->> 'email';
  IF v_email IN ('nexora67@gmail.com', 'vaibhavpatel8543@gmail.com') THEN
    RETURN TRUE;
  END IF;

  -- Check role in profiles table
  SELECT role::TEXT INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role IN ('admin', 'staff', 'owner') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 2. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING POLICIES SAFELY TO AVOID CONFLICTS
DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'categories', 'menu_items', 'orders',
      'order_items', 'addresses', 'payments', 'offers',
      'reviews', 'restaurant_settings'
    ])
  LOOP
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 4. GRANULAR POLICIES DEFINITIONS
-- ============================================================================

-- A. PROFILES
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_own_or_admin" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

-- B. CATEGORIES
CREATE POLICY "categories_public_read_active" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "categories_admin_manage" ON public.categories
  FOR ALL USING (public.is_admin());

-- C. MENU ITEMS
CREATE POLICY "menu_items_public_read_available" ON public.menu_items
  FOR SELECT USING (is_available = true OR public.is_admin());

CREATE POLICY "menu_items_admin_manage" ON public.menu_items
  FOR ALL USING (public.is_admin());

-- D. ORDERS
CREATE POLICY "orders_anyone_place" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_select_own_or_admin" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    public.is_admin()
  );

CREATE POLICY "orders_admin_manage" ON public.orders
  FOR ALL USING (public.is_admin());

-- E. ORDER ITEMS
CREATE POLICY "order_items_anyone_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_select_own_or_admin" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "order_items_admin_manage" ON public.order_items
  FOR ALL USING (public.is_admin());

-- F. ADDRESSES
CREATE POLICY "addresses_select_own" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_insert_own" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_update_own" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_delete_own" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- G. PAYMENTS
CREATE POLICY "payments_anyone_insert" ON public.payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "payments_select_own_or_admin" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "payments_admin_manage" ON public.payments
  FOR ALL USING (public.is_admin());

-- H. OFFERS & COUPONS
CREATE POLICY "offers_public_read_active" ON public.offers
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "offers_admin_manage" ON public.offers
  FOR ALL USING (public.is_admin());

-- I. REVIEWS
CREATE POLICY "reviews_public_read_approved" ON public.reviews
  FOR SELECT USING (is_approved = true OR public.is_admin());

CREATE POLICY "reviews_anyone_insert_pending" ON public.reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reviews_admin_manage" ON public.reviews
  FOR ALL USING (public.is_admin());

-- J. RESTAURANT SETTINGS
CREATE POLICY "restaurant_settings_public_read" ON public.restaurant_settings
  FOR SELECT USING (true);

CREATE POLICY "restaurant_settings_admin_manage" ON public.restaurant_settings
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- 5. STORAGE BUCKET POLICIES (menu-images)
-- ============================================================================
DO $$
BEGIN
  -- Create bucket if not exists
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('menu-images', 'menu-images', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Storage policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public view menu images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin upload menu images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin update menu images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin delete menu images" ON storage.objects;

  CREATE POLICY "Public view menu images" ON storage.objects
    FOR SELECT USING (bucket_id = 'menu-images');

  CREATE POLICY "Admin upload menu images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND (public.is_admin() OR auth.role() = 'authenticated'));

  CREATE POLICY "Admin update menu images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'menu-images' AND public.is_admin());

  CREATE POLICY "Admin delete menu images" ON storage.objects
    FOR DELETE USING (bucket_id = 'menu-images' AND public.is_admin());
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;


-- ==============================================================================
-- MIGRATION: 008_strict_rbac_and_admin_security.sql
-- ==============================================================================

-- ============================================================================
-- NEXORA - MIGRATION 008: STRICT ROLE-BASED ACCESS CONTROL (RBAC) & ADMIN HARDENING
-- Removes hardcoded email bypasses and enforces database role verification
-- ============================================================================

-- 1. Ensure 'owner' exists in user_role enum
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'owner';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. HARDENED ADMIN VERIFICATION FUNCTION (NO HARDCODED EMAIL BYPASS)
-- Strictly verifies service_role or database role ('owner', 'admin', 'staff') in profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Service role always has unrestricted administrative access
  IF current_setting('role', true) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Check authenticated user identity
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify role strictly in profiles table (No email-based bypasses)
  SELECT role::TEXT INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_role IN ('owner', 'admin', 'staff') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 3. SPECIFIC ROLE CHECK FUNCTIONS FOR GRANULAR RBAC
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::TEXT = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

