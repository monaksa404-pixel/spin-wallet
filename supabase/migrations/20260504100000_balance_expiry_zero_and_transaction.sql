CREATE OR REPLACE FUNCTION public.wallet_apply_balance_expiry()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w record;
DECLARE total numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO w FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF w.balance_deadline_at IS NULL OR w.balance_deadline_at > now() THEN RETURN; END IF;

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

    INSERT INTO public.transactions (user_id, kind, amount, description)
    VALUES (
      auth.uid(),
      'balance_expiry',
      -ROUND(total::numeric, 2),
      'Balance expired — deposit countdown ended'
    );
  ELSE
    UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = auth.uid();
  END IF;
END; $$;
