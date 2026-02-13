
-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);

-- Admins can view all receipts
CREATE POLICY "Admins can view payment receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));

-- Users can upload their own receipts
CREATE POLICY "Users can upload payment receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts' AND auth.uid() IS NOT NULL);

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add receipt_url column to orders
ALTER TABLE public.orders ADD COLUMN receipt_url text;
