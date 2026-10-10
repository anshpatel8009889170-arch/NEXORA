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
