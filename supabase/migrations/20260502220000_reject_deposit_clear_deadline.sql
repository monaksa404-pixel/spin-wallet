-- When the last pending deposit is rejected, clear rolling deadline so UI countdown hides.

CREATE OR REPLACE FUNCTION public.reject_deposit(_id uuid, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
DECLARE pending_left int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;

  UPDATE public.deposits
  SET status = 'rejected', admin_note = _note, reviewed_at = now()
  WHERE id = _id AND status = 'pending'
  RETURNING user_id INTO uid;

  IF uid IS NULL THEN RETURN; END IF;

  SELECT COUNT(*)::int INTO pending_left FROM public.deposits WHERE user_id = uid AND status = 'pending';

  IF pending_left = 0 THEN
    UPDATE public.wallets SET balance_deadline_at = NULL WHERE user_id = uid;
  END IF;
END; $$;
