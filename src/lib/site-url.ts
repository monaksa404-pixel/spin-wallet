/**
 * Origin used in Supabase auth email links (`emailRedirectTo`).
 * Set `VITE_SITE_URL=https://spin-wallet-six.vercel.app` on Vercel so verification
 * links never point at localhost when you tested signup locally.
 * Supabase Dashboard → Authentication → URL Configuration: add the same URL under Redirect URLs.
 */
export function getSiteOrigin(): string {
  const raw = import.meta.env.VITE_SITE_URL;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

export function getEmailConfirmRedirectUrl(): string | undefined {
  const o = getSiteOrigin();
  return o ? `${o}/` : undefined;
}
