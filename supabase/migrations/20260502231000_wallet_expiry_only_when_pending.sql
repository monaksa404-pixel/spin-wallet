-- Only zero balances when the rolling deadline has passed AND the user still has a pending deposit.
-- If there are no pending deposits (approved/rejected/cleared), clear a stale deadline without wiping funds.
-- Fixes approved credits disappearing on refresh when balance_deadline_at was left set.

CREATE OR REPLACE FUNCTION public.wallet_apply_balance_expiry()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w record;
DECLARE total numeric;
DECLARE still_pending boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF w.balance_deadline_at IS NOT NULL AND w.balance_deadline_at <= now() THEN
    SELECT EXISTS (
      SELECT 1 FROM public.deposits WHERE user_id = auth.uid() AND status = 'pending'
    ) INTO still_pending;

    IF NOT still_pending THEN
      UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = auth.uid();
      RETURN;
    END IF;

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
