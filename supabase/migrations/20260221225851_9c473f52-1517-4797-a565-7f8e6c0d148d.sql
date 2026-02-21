
-- Table to store WebAuthn credentials
CREATE TABLE public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credentials"
ON public.webauthn_credentials FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
ON public.webauthn_credentials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
ON public.webauthn_credentials FOR DELETE
USING (auth.uid() = user_id);

-- Service role needs access for verification edge function
CREATE POLICY "Service role full access"
ON public.webauthn_credentials FOR ALL
USING (true)
WITH CHECK (true);
