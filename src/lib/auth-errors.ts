type AuthLikeError = {
  message?: string;
  status?: number;
};

export function formatAuthUserFacingMessage(error: AuthLikeError): string {
  const raw = typeof error.message === "string" ? error.message : "";
  const lower = raw.toLowerCase();
  const status = typeof error.status === "number" ? error.status : undefined;

  const rateLimited =
    status === 429 ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("email rate limit");

  if (rateLimited) {
    return (
      "Signup emails are paused for this project: Supabase only allows a few confirmation emails per hour on the built-in mailer. " +
      "Wait about an hour and try again. To lift this permanently, open Supabase Dashboard → Authentication → Emails → SMTP Settings and configure Custom SMTP."
    );
  }

  return raw || "Something went wrong. Please try again.";
}
