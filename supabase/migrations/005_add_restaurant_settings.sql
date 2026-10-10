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
