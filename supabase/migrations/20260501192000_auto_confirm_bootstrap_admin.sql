-- Bootstrap admin can sign in with password without email confirmation (Supabase Auth).
-- Applies to admin@admin.com only.

-- Existing rows stuck at "email not confirmed"
UPDATE auth.users
SET email_confirmed_at = timezone('utc'::text, now())
WHERE email_confirmed_at IS NULL
  AND lower(trim(email)) = lower(trim('admin@admin.com'));

-- New sign-ups using this email: confirm before insert completes
CREATE OR REPLACE FUNCTION public.confirm_bootstrap_admin_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND lower(trim(NEW.email)) = lower(trim('admin@admin.com')) THEN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, timezone('utc'::text, now()));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS confirm_bootstrap_admin_email ON auth.users;
CREATE TRIGGER confirm_bootstrap_admin_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.confirm_bootstrap_admin_email();
