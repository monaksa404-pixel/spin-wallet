-- ============================================================
-- 1. deposit_settings: admin-editable bank + USDT instructions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deposit_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.deposit_settings (key, value) VALUES
  ('usdt_trc20_address',  'TVuAsd8Pq3X8h7Nqk9R2uJxpF39gYg7uZv'),
  ('bank_name',           'Al Rajhi Bank'),
  ('bank_account_name',   'GameBonus'),
  ('bank_account_number', '1234 5678 9012 3456'),
  ('bank_iban',           'SA12 3456 7890 1234 5678 9012')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.deposit_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "depsettings_read"  ON public.deposit_settings;
DROP POLICY IF EXISTS "depsettings_admin" ON public.deposit_settings;
CREATE POLICY "depsettings_read"  ON public.deposit_settings FOR SELECT USING (true);
CREATE POLICY "depsettings_admin" ON public.deposit_settings FOR ALL    USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 2. deposits.bonus_amount column
-- ============================================================
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS bonus_amount numeric(14,2) DEFAULT 0;

-- ============================================================
-- 3. approve_deposit — credit both balance AND bonus_balance
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_deposit(
  _id     uuid,
  _amount numeric,
  _bonus  numeric DEFAULT 0
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;

  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit not found'; END IF;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  UPDATE public.deposits
    SET status       = 'approved',
        amount       = _amount,
        bonus_amount = COALESCE(_bonus, 0),
        reviewed_at  = now()
    WHERE id = _id;

  INSERT INTO public.wallets (user_id, balance, bonus_balance, pending_balance, coins)
  VALUES (d.user_id, _amount, COALESCE(_bonus, 0), 0, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance                  = public.wallets.balance + EXCLUDED.balance,
    bonus_balance            = public.wallets.bonus_balance + EXCLUDED.bonus_balance,
    balance_deadline_at      = NULL,
    balance_expired_at       = NULL,
    expired_balance_snapshot = NULL,
    missed_deadline_at       = NULL;

  INSERT INTO public.transactions (user_id, kind, amount, description, ref_id)
  VALUES (d.user_id, 'deposit', _amount, 'Deposit (' || d.method || ') approved', d.id);

  IF COALESCE(_bonus, 0) > 0 THEN
    INSERT INTO public.transactions (user_id, kind, amount, description, ref_id)
    VALUES (d.user_id, 'bonus', _bonus, 'Bonus for ' || d.method || ' deposit', d.id);
  END IF;
END; $$;

-- ============================================================
-- 4. admin_set_user_deadline — set per-user countdown deadline
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_deadline(
  _user_id     uuid,
  _deadline_at timestamptz
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  INSERT INTO public.wallets (user_id, balance_deadline_at)
  VALUES (_user_id, _deadline_at)
  ON CONFLICT (user_id) DO UPDATE SET balance_deadline_at = _deadline_at;
END; $$;
