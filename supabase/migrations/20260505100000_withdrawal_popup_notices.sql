CREATE TABLE IF NOT EXISTS public.withdrawal_popup_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  withdrawal_id uuid NOT NULL REFERENCES public.withdrawals(id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failed', 'pending')),
  title text NOT NULL,
  body text NOT NULL,
  failure_reason text,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS withdrawal_popup_notices_user_open_idx
  ON public.withdrawal_popup_notices (user_id)
  WHERE dismissed_at IS NULL;

ALTER TABLE public.withdrawal_popup_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawal_popup_notices_select_own" ON public.withdrawal_popup_notices;
CREATE POLICY "withdrawal_popup_notices_select_own"
  ON public.withdrawal_popup_notices FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS withdrawal_status text,
  ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_popup_notices;

DROP FUNCTION IF EXISTS public.approve_withdrawal(uuid);
CREATE OR REPLACE FUNCTION public.approve_withdrawal(
  _id uuid,
  _popup_title text DEFAULT NULL,
  _popup_message text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals%ROWTYPE;
DECLARE t_title text;
DECLARE t_body text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  t_title := COALESCE(NULLIF(trim(_popup_title), ''), 'Withdrawal approved');
  t_body  := COALESCE(NULLIF(trim(_popup_message), ''), 'Your withdrawal request was approved. Funds are being sent to your selected method.');

  UPDATE public.withdrawals SET status = 'approved', reviewed_at = now() WHERE id = _id;
  UPDATE public.wallets SET pending_balance = pending_balance - w.amount WHERE user_id = w.user_id;

  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id, withdrawal_status, failure_reason)
  VALUES (
    w.user_id,
    'withdrawal',
    -w.amount,
    t_body,
    w.id,
    'approved',
    NULL
  );

  INSERT INTO public.withdrawal_popup_notices (user_id, withdrawal_id, outcome, title, body, failure_reason)
  VALUES (w.user_id, _id, 'success', t_title, t_body, NULL);
END; $$;

DROP FUNCTION IF EXISTS public.reject_withdrawal(uuid, text);
CREATE OR REPLACE FUNCTION public.reject_withdrawal(
  _id uuid,
  _popup_title text,
  _popup_message text,
  _failure_reason text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals%ROWTYPE;
DECLARE t_title text;
DECLARE t_body text;
DECLARE t_fail text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  t_title := COALESCE(NULLIF(trim(_popup_title), ''), 'Withdrawal declined');
  t_body  := COALESCE(NULLIF(trim(_popup_message), ''), 'Your withdrawal could not be completed.');
  t_fail  := COALESCE(NULLIF(trim(_failure_reason), ''), 'No details provided');

  UPDATE public.withdrawals
  SET status = 'rejected', admin_note = t_fail, reviewed_at = now()
  WHERE id = _id;

  UPDATE public.wallets
  SET balance = balance + w.amount, pending_balance = pending_balance - w.amount
  WHERE user_id = w.user_id;

  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id, withdrawal_status, failure_reason)
  VALUES (
    w.user_id,
    'withdrawal',
    w.amount,
    t_body,
    w.id,
    'rejected',
    t_fail
  );

  INSERT INTO public.withdrawal_popup_notices (user_id, withdrawal_id, outcome, title, body, failure_reason)
  VALUES (w.user_id, _id, 'failed', t_title, t_body, t_fail);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_withdrawal_pending_notice(
  _withdrawal_id uuid,
  _popup_title text,
  _popup_message text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals%ROWTYPE;
DECLARE t_title text;
DECLARE t_body text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = _withdrawal_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'withdrawal not found'; END IF;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'only pending withdrawals can receive a pending notice'; END IF;

  t_title := COALESCE(NULLIF(trim(_popup_title), ''), 'Withdrawal update');
  t_body  := COALESCE(NULLIF(trim(_popup_message), ''), 'Your withdrawal is still being reviewed.');

  INSERT INTO public.withdrawal_popup_notices (user_id, withdrawal_id, outcome, title, body, failure_reason)
  VALUES (w.user_id, _withdrawal_id, 'pending', t_title, t_body, NULL);
END; $$;

CREATE OR REPLACE FUNCTION public.dismiss_withdrawal_popup(_notice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.withdrawal_popup_notices
  SET dismissed_at = now()
  WHERE id = _notice_id AND user_id = auth.uid() AND dismissed_at IS NULL;
END; $$;

REVOKE ALL ON FUNCTION public.approve_withdrawal(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_withdrawal(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_withdrawal_pending_notice(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dismiss_withdrawal_popup(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_withdrawal_pending_notice(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.dismiss_withdrawal_popup(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_withdrawal_pending_notice(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_withdrawal_popup(uuid) TO authenticated;
