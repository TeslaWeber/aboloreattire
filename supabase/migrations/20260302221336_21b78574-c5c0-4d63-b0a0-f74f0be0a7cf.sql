
-- Drop webauthn_credentials table and all its RLS policies
DROP POLICY IF EXISTS "Users can delete their own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can insert their own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON public.webauthn_credentials;
DROP POLICY IF EXISTS "Users can view their own credentials" ON public.webauthn_credentials;
DROP TABLE IF EXISTS public.webauthn_credentials;

-- Create site_settings table for payment mode toggle
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default payment mode
INSERT INTO public.site_settings (key, value) VALUES ('payment_mode', 'paystack');
