-- approve_deposit previously did UPDATE wallets ... WHERE user_id = ...
-- If no wallet row existed (legacy users, failed signup trigger), UPDATE touched 0 rows and balance stayed 0.
-- Upsert credits reliably.

CREATE OR REPLACE FUNCTION public.approve_deposit(_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  UPDATE public.deposits SET status = 'approved', amount = _amount, reviewed_at = now() WHERE id = _id;

  INSERT INTO public.wallets (user_id, balance)
  VALUES (d.user_id, _amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = public.wallets.balance + EXCLUDED.balance,
    balance_deadline_at = NULL,
    balance_expired_at = NULL,
    expired_balance_snapshot = NULL,
    missed_deadline_at = NULL;

  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id)
  VALUES (d.user_id, 'deposit', _amount, 'Deposit ('||d.method||') approved', d.id);
END; $$;
