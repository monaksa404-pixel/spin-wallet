CREATE TABLE IF NOT EXISTS public.deposit_popup_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deposit_id uuid NOT NULL REFERENCES public.deposits(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failed', 'pending')),
  title text NOT NULL,
  body text NOT NULL,
  failure_reason text,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deposit_popup_notices_user_open_idx
  ON public.deposit_popup_notices (user_id)
  WHERE dismissed_at IS NULL;

ALTER TABLE public.deposit_popup_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deposit_popup_notices_select_own" ON public.deposit_popup_notices;
CREATE POLICY "deposit_popup_notices_select_own"
  ON public.deposit_popup_notices FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS deposit_status text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_popup_notices;

DROP FUNCTION IF EXISTS public.approve_deposit(uuid, numeric, numeric);
CREATE OR REPLACE FUNCTION public.approve_deposit(
  _id uuid,
  _amount numeric,
  _bonus numeric DEFAULT 0,
  _popup_title text DEFAULT NULL,
  _popup_message text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
DECLARE t_title text;
DECLARE t_body text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;

  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit not found'; END IF;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  t_title := COALESCE(NULLIF(trim(_popup_title), ''), 'Deposit approved');
  t_body  := COALESCE(NULLIF(trim(_popup_message), ''), 'Your deposit was approved and credited to your balance.');

  UPDATE public.deposits
  SET status = 'approved',
      amount = _amount,
      bonus_amount = COALESCE(_bonus, 0),
      reviewed_at = now()
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

  INSERT INTO public.transactions (user_id, kind, amount, description, ref_id, withdrawal_status, deposit_status, failure_reason)
  VALUES (d.user_id, 'deposit', _amount, t_body, d.id, NULL, 'approved', NULL);

  IF COALESCE(_bonus, 0) > 0 THEN
    INSERT INTO public.transactions (user_id, kind, amount, description, ref_id, withdrawal_status, deposit_status, failure_reason)
    VALUES (d.user_id, 'bonus', _bonus, 'Bonus for ' || d.method || ' deposit', d.id, NULL, NULL, NULL);
  END IF;

  INSERT INTO public.deposit_popup_notices (user_id, deposit_id, outcome, title, body, failure_reason)
  VALUES (d.user_id, _id, 'success', t_title, t_body, NULL);
END; $$;

DROP FUNCTION IF EXISTS public.reject_deposit(uuid, text);
CREATE OR REPLACE FUNCTION public.reject_deposit(
  _id uuid,
  _popup_title text,
  _popup_message text,
  _failure_reason text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
DECLARE pending_left int;
DECLARE t_title text;
DECLARE t_body text;
DECLARE t_fail text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;

  t_title := COALESCE(NULLIF(trim(_popup_title), ''), 'Deposit declined');
  t_body  := COALESCE(NULLIF(trim(_popup_message), ''), 'Your deposit could not be approved.');
  t_fail  := COALESCE(NULLIF(trim(_failure_reason), ''), 'No details provided');

  UPDATE public.deposits
  SET status = 'rejected', admin_note = t_fail, reviewed_at = now()
  WHERE id = _id AND status = 'pending'
  RETURNING user_id INTO uid;

  IF uid IS NULL THEN RETURN; END IF;

  INSERT INTO public.transactions (user_id, kind, amount, description, ref_id, withdrawal_status, deposit_status, failure_reason)
  VALUES (uid, 'deposit', 0, t_body, _id, NULL, 'rejected', t_fail);

  INSERT INTO public.deposit_popup_notices (user_id, deposit_id, outcome, title, body, failure_reason)
  VALUES (uid, _id, 'failed', t_title, t_body, t_fail);

  SELECT COUNT(*)::int INTO pending_left FROM public.deposits WHERE user_id = uid AND status = 'pending';

  IF pending_left = 0 THEN
    UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = uid;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_deposit_pending_notice(
  _deposit_id uuid,
  _popup_title text,
  _popup_message text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
DECLARE t_title text;
DECLARE t_body text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO d FROM public.deposits WHERE id = _deposit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit not found'; END IF;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'only pending deposits can receive a pending notice'; END IF;

  t_title := COALESCE(NULLIF(trim(_popup_title), ''), 'Deposit update');
  t_body  := COALESCE(NULLIF(trim(_popup_message), ''), 'Your deposit is still being reviewed.');

  INSERT INTO public.deposit_popup_notices (user_id, deposit_id, outcome, title, body, failure_reason)
  VALUES (d.user_id, _deposit_id, 'pending', t_title, t_body, NULL);
END; $$;

CREATE OR REPLACE FUNCTION public.dismiss_deposit_popup(_notice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.deposit_popup_notices
  SET dismissed_at = now()
  WHERE id = _notice_id AND user_id = auth.uid() AND dismissed_at IS NULL;
END; $$;

REVOKE ALL ON FUNCTION public.approve_deposit(uuid, numeric, numeric, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_deposit(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_deposit_pending_notice(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dismiss_deposit_popup(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.approve_deposit(uuid, numeric, numeric, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_deposit(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_deposit_pending_notice(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.dismiss_deposit_popup(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.approve_deposit(uuid, numeric, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deposit(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_deposit_pending_notice(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_deposit_popup(uuid) TO authenticated;
