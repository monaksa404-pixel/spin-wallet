REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.approve_deposit(uuid, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_deposit(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(withdraw_method, numeric, text, text, text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.approve_withdrawal(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_withdrawal(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.approve_spin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_spin(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_deposit(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deposit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(withdraw_method, numeric, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_withdrawal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_withdrawal(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_spin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_spin(uuid) TO authenticated;