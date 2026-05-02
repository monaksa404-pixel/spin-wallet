/**
 * Bootstrap admin email: treated as admin in the app after login (see useAuth).
 * Create this user in Supabase Auth with your chosen password.
 */
export const ADMIN_LOGIN_EMAIL = "admin@admin.com";

export function isBootstrapAdminEmail(email: string | undefined | null): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_LOGIN_EMAIL.toLowerCase();
}
