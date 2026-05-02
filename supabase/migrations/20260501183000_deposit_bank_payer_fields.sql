-- User-submitted payer/reference details for bank wire deposits (admin verification)
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS payer_account_name text,
  ADD COLUMN IF NOT EXISTS payer_account_number text,
  ADD COLUMN IF NOT EXISTS payer_iban text;
