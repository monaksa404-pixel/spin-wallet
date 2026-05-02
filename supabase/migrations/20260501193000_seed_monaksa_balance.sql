-- Test bootstrap for QA user balance
-- Sets 12,000 USDT for monaksa404@gmail.com to test deposit/withdraw/game flows.

DO $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim('monaksa404@gmail.com'))
  LIMIT 1;

  IF _uid IS NOT NULL THEN
    INSERT INTO public.wallets (user_id, balance, bonus_balance, pending_balance, coins)
    VALUES (_uid, 12000, 0, 0, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET
      balance = 12000,
      bonus_balance = COALESCE(public.wallets.bonus_balance, 0),
      pending_balance = COALESCE(public.wallets.pending_balance, 0),
      coins = COALESCE(public.wallets.coins, 0);
  END IF;
END $$;
