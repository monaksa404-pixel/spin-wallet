-- Remove the trigger that auto-set balance_deadline_at on every deposit insert.
-- Countdown deadlines are now set manually per-user by admin only.
DROP TRIGGER IF EXISTS trg_deposits_refresh_balance_deadline ON public.deposits;
DROP FUNCTION IF EXISTS public.deposits_refresh_balance_deadline();

-- Also remove the global deadline hours admin function (no longer used).
DROP FUNCTION IF EXISTS public.admin_set_balance_deadline_hours(numeric);
