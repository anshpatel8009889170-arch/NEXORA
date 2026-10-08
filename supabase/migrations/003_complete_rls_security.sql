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
