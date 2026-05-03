-- ============================================================
-- 1. offer_countdowns: per-user per-offer countdown timers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offer_countdowns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id   text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, offer_id)
);

ALTER TABLE public.offer_countdowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offer_countdowns_own"   ON public.offer_countdowns;
DROP POLICY IF EXISTS "offer_countdowns_admin" ON public.offer_countdowns;
CREATE POLICY "offer_countdowns_own"   ON public.offer_countdowns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "offer_countdowns_admin" ON public.offer_countdowns FOR ALL    USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_set_offer_countdown(
  _user_id    uuid,
  _offer_id   text,
  _expires_at timestamptz
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  INSERT INTO public.offer_countdowns (user_id, offer_id, expires_at)
  VALUES (_user_id, _offer_id, _expires_at)
  ON CONFLICT (user_id, offer_id) DO UPDATE SET expires_at = _expires_at;
END; $$;

-- ============================================================
-- 2. profiles: add email column (synced from auth.users)
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- ============================================================
-- 3. admin helper: get full user profiles with email
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_user_profiles()
RETURNS TABLE(
  id           uuid,
  full_name    text,
  email        text,
  status       text,
  created_at   timestamptz,
  balance      numeric,
  bonus_balance numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  RETURN QUERY
  SELECT p.id, p.full_name, COALESCE(p.email, u.email) AS email,
         p.status, p.created_at,
         COALESCE(w.balance, 0)::numeric,
         COALESCE(w.bonus_balance, 0)::numeric
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.wallets w ON w.user_id = p.id
  ORDER BY p.created_at DESC;
END; $$;

-- ============================================================
-- 4. admin_update_username: admin edits a user's display name
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_username(
  _user_id  uuid,
  _new_name text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  UPDATE public.profiles SET full_name = _new_name WHERE id = _user_id;
END; $$;
