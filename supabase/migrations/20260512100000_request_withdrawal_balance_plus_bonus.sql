CREATE OR REPLACE FUNCTION public.request_withdrawal(
  _method withdraw_method,
  _amount numeric,
  _usdt_address text,
  _account_name text,
  _account_number text,
  _iban text,
  _bank_name text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  wid uuid;
  b numeric;
  bb numeric;
  from_bal numeric;
  from_bonus numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount < 1000 THEN RAISE EXCEPTION 'minimum withdrawal is 1000'; END IF;

  SELECT balance, bonus_balance INTO b, bb
  FROM public.wallets
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'wallet not found'; END IF;
  IF COALESCE(b, 0) + COALESCE(bb, 0) < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  from_bal := LEAST(COALESCE(b, 0), _amount);
  from_bonus := _amount - from_bal;

  UPDATE public.wallets SET
    balance = balance - from_bal,
    bonus_balance = bonus_balance - from_bonus,
    pending_balance = pending_balance + _amount
  WHERE user_id = auth.uid();

  INSERT INTO public.withdrawals(user_id, method, amount, usdt_address, account_name, account_number, iban, bank_name)
  VALUES (auth.uid(), _method, _amount, _usdt_address, _account_name, _account_number, _iban, _bank_name)
  RETURNING id INTO wid;

  RETURN wid;
END;
$$;
