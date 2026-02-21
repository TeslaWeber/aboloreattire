
-- Drop the overly permissive policy
DROP POLICY "Service role full access" ON public.webauthn_credentials;

-- Add update policy for counter updates (service role will bypass RLS anyway)
CREATE POLICY "Users can update their own credentials"
ON public.webauthn_credentials FOR UPDATE
USING (auth.uid() = user_id);
