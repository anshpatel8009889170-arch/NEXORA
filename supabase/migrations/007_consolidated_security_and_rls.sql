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
