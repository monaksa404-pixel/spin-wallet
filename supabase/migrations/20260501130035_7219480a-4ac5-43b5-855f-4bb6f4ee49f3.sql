
-- Add coins to wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS coins numeric NOT NULL DEFAULT 0;

-- Add game tag to spin_rewards (re-used for all games)
ALTER TABLE public.spin_rewards ADD COLUMN IF NOT EXISTS game text NOT NULL DEFAULT 'luck_wheel';
ALTER TABLE public.spin_rewards ADD COLUMN IF NOT EXISTS bet_coins numeric NOT NULL DEFAULT 0;

-- Convert USDT balance to coins (1 USDT = 100 coins)
CREATE OR REPLACE FUNCTION public.convert_to_coins(_usdt numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bal numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _usdt <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  SELECT balance INTO bal FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF bal < _usdt THEN RAISE EXCEPTION 'insufficient USDT balance'; END IF;
  UPDATE public.wallets
    SET balance = balance - _usdt, coins = coins + (_usdt * 100)
    WHERE user_id = auth.uid();
  INSERT INTO public.transactions(user_id, kind, amount, description)
    VALUES (auth.uid(), 'convert', -_usdt, 'Converted to '||(_usdt*100)||' coins');
END; $$;

CREATE OR REPLACE FUNCTION public.convert_to_usdt(_coins numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _coins <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  SELECT coins INTO c FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF c < _coins THEN RAISE EXCEPTION 'insufficient coins'; END IF;
  UPDATE public.wallets
    SET coins = coins - _coins, balance = balance + (_coins / 100.0)
    WHERE user_id = auth.uid();
  INSERT INTO public.transactions(user_id, kind, amount, description)
    VALUES (auth.uid(), 'convert', (_coins/100.0), 'Converted '||_coins||' coins to USDT');
END; $$;

-- Play a game: deduct coins as bet, log pending reward (computed_amount in USDT)
CREATE OR REPLACE FUNCTION public.play_game(
  _game text, _bet_coins numeric,
  _prize_label text, _prize_kind text, _prize_value numeric
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c numeric; computed numeric; bet_usdt numeric; sid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _bet_coins <= 0 THEN RAISE EXCEPTION 'invalid bet'; END IF;
  SELECT coins INTO c FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF c < _bet_coins THEN RAISE EXCEPTION 'insufficient coins'; END IF;

  bet_usdt := _bet_coins / 100.0;
  -- Compute reward in USDT based on the bet
  IF _prize_kind = 'multiplier' THEN
    computed := bet_usdt * _prize_value;          -- 0x = 0, 1x = bet back, 5x = 5x bet
  ELSIF _prize_kind = 'percent' THEN
    computed := bet_usdt * (_prize_value / 100.0);
  ELSE
    computed := _prize_value;
  END IF;

  -- deduct coins (the bet)
  UPDATE public.wallets SET coins = coins - _bet_coins WHERE user_id = auth.uid();

  INSERT INTO public.spin_rewards(
    user_id, prize_label, prize_kind, prize_value,
    balance_at_spin, computed_amount, game, bet_coins
  ) VALUES (
    auth.uid(), _prize_label, _prize_kind, _prize_value,
    bet_usdt, ROUND(computed::numeric, 2), _game, _bet_coins
  ) RETURNING id INTO sid;

  RETURN sid;
END; $$;
