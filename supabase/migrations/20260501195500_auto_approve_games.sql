-- Auto-approve game rewards: credit immediately and still log for admin visibility.
CREATE OR REPLACE FUNCTION public.play_game(
  _game text, _bet_coins numeric,
  _prize_label text, _prize_kind text, _prize_value numeric
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c numeric;
  computed numeric;
  bet_usdt numeric;
  sid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _bet_coins <= 0 THEN RAISE EXCEPTION 'invalid bet'; END IF;

  SELECT coins INTO c FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF c < _bet_coins THEN RAISE EXCEPTION 'insufficient coins'; END IF;

  bet_usdt := _bet_coins / 100.0;

  IF _prize_kind = 'multiplier' THEN
    computed := bet_usdt * _prize_value;
  ELSIF _prize_kind = 'percent' THEN
    computed := bet_usdt * (_prize_value / 100.0);
  ELSE
    computed := _prize_value;
  END IF;

  -- Deduct bet coins and immediately credit USDT reward to main balance
  UPDATE public.wallets
  SET coins = coins - _bet_coins,
      balance = balance + ROUND(computed::numeric, 2)
  WHERE user_id = auth.uid();

  INSERT INTO public.spin_rewards(
    user_id, prize_label, prize_kind, prize_value,
    balance_at_spin, computed_amount, game, bet_coins, status, reviewed_at
  ) VALUES (
    auth.uid(), _prize_label, _prize_kind, _prize_value,
    bet_usdt, ROUND(computed::numeric, 2), _game, _bet_coins, 'approved', now()
  ) RETURNING id INTO sid;

  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id)
  VALUES (
    auth.uid(),
    'spin',
    ROUND(computed::numeric, 2),
    'Game reward auto-approved (' || _game || ' · ' || _prize_label || ')',
    sid
  );

  RETURN sid;
END; $$;
