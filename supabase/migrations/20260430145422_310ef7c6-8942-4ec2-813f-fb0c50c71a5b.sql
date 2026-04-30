-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  status text NOT NULL DEFAULT 'active', -- active | banned
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Wallets
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  bonus_balance numeric(14,2) NOT NULL DEFAULT 0,
  pending_balance numeric(14,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all wallets" ON public.wallets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update wallets" ON public.wallets FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Deposits
CREATE TYPE public.deposit_method AS ENUM ('gift_card', 'usdt', 'bank');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method deposit_method NOT NULL,
  amount numeric(14,2),                 -- final approved amount (admin sets for gift card)
  requested_amount numeric(14,2),       -- what user typed
  -- gift card
  gift_card_brand text,
  gift_card_code text,
  -- usdt
  usdt_tx_address text,
  -- bank (al rajhi target — no input from user)
  status request_status NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all deposits" ON public.deposits FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update deposits" ON public.deposits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Withdrawals
CREATE TYPE public.withdraw_method AS ENUM ('usdt', 'bank');
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method withdraw_method NOT NULL,
  amount numeric(14,2) NOT NULL,
  -- usdt
  usdt_address text,
  -- bank
  account_name text,
  account_number text,
  iban text,
  bank_name text,
  status request_status NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all withdrawals" ON public.withdrawals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update withdrawals" ON public.withdrawals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Spin rewards
CREATE TABLE public.spin_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_label text NOT NULL,         -- e.g. "2X", "5%", "10%"
  prize_kind text NOT NULL,          -- 'multiplier' | 'percent' | 'fixed'
  prize_value numeric(14,4) NOT NULL,
  balance_at_spin numeric(14,2) NOT NULL,
  computed_amount numeric(14,2) NOT NULL,  -- amount to credit if approved
  status request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE public.spin_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own spins" ON public.spin_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own spins" ON public.spin_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all spins" ON public.spin_rewards FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update spins" ON public.spin_rewards FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Transactions (history feed)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,    -- deposit | withdrawal | spin | adjustment
  amount numeric(14,2) NOT NULL,  -- positive credit, negative debit
  description text,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER touch_profiles BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_wallets BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile, wallet, role on signup; first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count int;
  assigned_role app_role;
BEGIN
  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN assigned_role := 'admin'; ELSE assigned_role := 'user'; END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Approve deposit RPC: admin sets amount and approves; credits wallet + writes transaction
CREATE OR REPLACE FUNCTION public.approve_deposit(_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.deposits%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO d FROM public.deposits WHERE id = _id FOR UPDATE;
  IF d.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;

  UPDATE public.deposits SET status='approved', amount=_amount, reviewed_at=now() WHERE id=_id;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = d.user_id;
  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id)
  VALUES (d.user_id, 'deposit', _amount, 'Deposit ('||d.method||') approved', d.id);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_deposit(_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  UPDATE public.deposits SET status='rejected', admin_note=_note, reviewed_at=now() WHERE id=_id AND status='pending';
END; $$;

-- Withdrawal RPCs
CREATE OR REPLACE FUNCTION public.request_withdrawal(_method withdraw_method, _amount numeric, _usdt_address text, _account_name text, _account_number text, _iban text, _bank_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE wid uuid; bal numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount < 1000 THEN RAISE EXCEPTION 'minimum withdrawal is 1000'; END IF;
  SELECT balance INTO bal FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
  IF bal < _amount THEN RAISE EXCEPTION 'insufficient balance'; END IF;
  -- hold funds: move to pending
  UPDATE public.wallets SET balance = balance - _amount, pending_balance = pending_balance + _amount WHERE user_id = auth.uid();
  INSERT INTO public.withdrawals(user_id, method, amount, usdt_address, account_name, account_number, iban, bank_name)
  VALUES (auth.uid(), _method, _amount, _usdt_address, _account_name, _account_number, _iban, _bank_name) RETURNING id INTO wid;
  RETURN wid;
END; $$;

CREATE OR REPLACE FUNCTION public.approve_withdrawal(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id=_id FOR UPDATE;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;
  UPDATE public.withdrawals SET status='approved', reviewed_at=now() WHERE id=_id;
  UPDATE public.wallets SET pending_balance = pending_balance - w.amount WHERE user_id = w.user_id;
  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id)
  VALUES (w.user_id, 'withdrawal', -w.amount, 'Withdrawal ('||w.method||') approved', w.id);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id=_id FOR UPDATE;
  IF w.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;
  UPDATE public.withdrawals SET status='rejected', admin_note=_note, reviewed_at=now() WHERE id=_id;
  -- refund hold
  UPDATE public.wallets SET balance = balance + w.amount, pending_balance = pending_balance - w.amount WHERE user_id = w.user_id;
END; $$;

-- Spin RPCs
CREATE OR REPLACE FUNCTION public.approve_spin(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.spin_rewards%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  SELECT * INTO s FROM public.spin_rewards WHERE id=_id FOR UPDATE;
  IF s.status <> 'pending' THEN RAISE EXCEPTION 'already reviewed'; END IF;
  UPDATE public.spin_rewards SET status='approved', reviewed_at=now() WHERE id=_id;
  UPDATE public.wallets SET bonus_balance = bonus_balance + s.computed_amount WHERE user_id = s.user_id;
  INSERT INTO public.transactions(user_id, kind, amount, description, ref_id)
  VALUES (s.user_id, 'spin', s.computed_amount, 'Spin reward '||s.prize_label||' approved', s.id);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_spin(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  UPDATE public.spin_rewards SET status='rejected', reviewed_at=now() WHERE id=_id AND status='pending';
END; $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spin_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;