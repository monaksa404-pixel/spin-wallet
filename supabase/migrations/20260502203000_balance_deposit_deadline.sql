-- Rolling deadline: starts when user submits any pending deposit; if not admin-approved before
-- deadline_hours elapse, USDT balance + bonus + coins are zeroed (snapshot kept for messaging).
-- Admin-approved deposit clears deadline and expiry banners.

CREATE TABLE IF NOT EXISTS public.balance_deadline_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  deadline_hours numeric(8, 2) NOT NULL DEFAULT 10 CHECK (deadline_hours > 0 AND deadline_hours <= 720),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.balance_deadline_settings (id, deadline_hours) VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.balance_deadline_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed-in reads deadline settings"
  ON public.balance_deadline_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins update deadline settings"
  ON public.balance_deadline_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_balance_deadline_settings BEFORE UPDATE ON public.balance_deadline_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS balance_deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS balance_expired_at timestamptz,
  ADD COLUMN IF NOT EXISTS expired_balance_snapshot numeric(14, 2),
  ADD COLUMN IF NOT EXISTS missed_deadline_at timestamptz;

CREATE OR REPLACE FUNCTION public.deposits_refresh_balance_deadline()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE h numeric;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT deadline_hours INTO h FROM public.balance_deadline_settings WHERE id = 1;
    IF h IS NULL THEN h := 10; END IF;
    UPDATE public.wallets
    SET balance_deadline_at = now() + (h * interval '1 hour')
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_deposits_refresh_balance_deadline ON public.deposits;
CREATE TRIGGER trg_deposits_refresh_balance_deadline
  AFTER INSERT ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.deposits_refresh_balance_deadline();

CREATE OR REPLACE FUNCTION public.wallet_apply_balance_expiry()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w record;
DECLARE total numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF w.balance_deadline_at IS NOT NULL AND w.balance_deadline_at <= now() THEN
    total := COALESCE(w.balance, 0) + COALESCE(w.bonus_balance, 0) + (COALESCE(w.coins, 0) / 100.0);
    IF total > 0 THEN
      UPDATE public.wallets SET
        balance = 0,
        bonus_balance = 0,
        coins = 0,
        expired_balance_snapshot = ROUND(total::numeric, 2),
        missed_deadline_at = w.balance_deadline_at,
        balance_expired_at = now(),
        balance_deadline_at = NULL
      WHERE user_id = auth.uid();
    ELSE
      UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = auth.uid();
    END IF;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_balance_deadline_hours(_hours numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  IF _hours <= 0 OR _hours > 720 THEN RAISE EXCEPTION 'hours must be between 0 exclusive and 720'; END IF;
  UPDATE public.balance_deadline_settings SET deadline_hours = _hours WHERE id = 1;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_deposit(_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  UPDATE public.deposits SET status='approved', amount=_amount, reviewed_at=now() WHERE id=_id;
  UPDATE public.wallets SET
    balance = balance + _amount,
    balance_deadline_at = NULL,
    balance_expired_at = NULL,
    expired_balance_snapshot = NULL,
    missed_deadline_at = NULL
  WHERE user_id = d.user_id;
  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id)
  VALUES (d.user_id, 'deposit', _amount, 'Deposit ('||d.method||') approved', d.id);
END; $$;

REVOKE EXECUTE ON FUNCTION public.wallet_apply_balance_expiry() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_balance_deadline_hours(numeric) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.wallet_apply_balance_expiry() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_balance_deadline_hours(numeric) TO authenticated;
