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
