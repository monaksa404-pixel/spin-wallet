-- ============================================================
-- DEFINITIVE FIX: approve_deposit + wallet_apply_balance_expiry
-- ============================================================
-- approve_deposit: upsert so balance always credits even if wallet row missing.
--   Clears ALL deadline/expiry fields atomically so balance can never be wiped
--   by a subsequent expiry check after approval.
-- wallet_apply_balance_expiry: only expires balance when deadline is past AND
--   the user still has at least one pending deposit (not approved/rejected).

CREATE OR REPLACE FUNCTION public.approve_deposit(_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;

  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'deposit not found'; END IF;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  -- Mark deposit approved
  UPDATE public.deposits
    SET status = 'approved', amount = _amount, reviewed_at = now()
    WHERE id = _id;

  -- Credit wallet; create row if missing (handles legacy accounts)
  INSERT INTO public.wallets (user_id, balance, bonus_balance, pending_balance, coins)
  VALUES (d.user_id, _amount, 0, 0, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    balance               = public.wallets.balance + EXCLUDED.balance,
    balance_deadline_at   = NULL,
    balance_expired_at    = NULL,
    expired_balance_snapshot = NULL,
    missed_deadline_at    = NULL;

  -- Transaction record
  INSERT INTO public.transactions (user_id, kind, amount, description, ref_id)
  VALUES (d.user_id, 'deposit', _amount, 'Deposit (' || d.method || ') approved', d.id);
END; $$;


CREATE OR REPLACE FUNCTION public.wallet_apply_balance_expiry()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w     record;
DECLARE total numeric;
DECLARE still_pending boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  -- Nothing to do if no rolling deadline is set or deadline is still in the future
  IF w.balance_deadline_at IS NULL OR w.balance_deadline_at > now() THEN RETURN; END IF;

  -- Deadline has passed.  Only expire balance if there is STILL a pending deposit.
  -- If the deposit was approved (or rejected), there is no penalty: just clear the stale deadline.
  SELECT EXISTS (
    SELECT 1 FROM public.deposits WHERE user_id = auth.uid() AND status = 'pending'
  ) INTO still_pending;

  IF NOT still_pending THEN
    -- Deposit was approved or rejected; stale deadline — clear it without touching balance.
    UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = auth.uid();
    RETURN;
  END IF;

  -- Deadline passed with an unapproved pending deposit: expire balance.
  total := COALESCE(w.balance, 0)
         + COALESCE(w.bonus_balance, 0)
         + (COALESCE(w.coins, 0) / 100.0);

  IF total > 0 THEN
    UPDATE public.wallets SET
      balance                  = 0,
      bonus_balance            = 0,
      coins                    = 0,
      expired_balance_snapshot = ROUND(total::numeric, 2),
      missed_deadline_at       = w.balance_deadline_at,
      balance_expired_at       = now(),
      balance_deadline_at      = NULL
    WHERE user_id = auth.uid();
  ELSE
    UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = auth.uid();
  END IF;
END; $$;


-- reject_deposit: clear stale deadline when no pending deposits remain
CREATE OR REPLACE FUNCTION public.reject_deposit(_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid_out uuid;
DECLARE pending_left int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;

  UPDATE public.deposits
    SET status = 'rejected', admin_note = _note, reviewed_at = now()
    WHERE id = _id AND status = 'pending'
    RETURNING user_id INTO uid_out;

  IF uid_out IS NULL THEN RETURN; END IF;

  SELECT COUNT(*)::int INTO pending_left
    FROM public.deposits WHERE user_id = uid_out AND status = 'pending';

  IF pending_left = 0 THEN
    UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = uid_out;
  END IF;
END; $$;
