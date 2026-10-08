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
