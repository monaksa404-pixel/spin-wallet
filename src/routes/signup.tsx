import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getEmailConfirmRedirectUrl } from "@/lib/site-url";
import { formatAuthUserFacingMessage } from "@/lib/auth-errors";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — GameBonus" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const submitLock = useRef(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || submitLock.current) return;
    submitLock.current = true;
    setBusy(true);
    const redirectTo = getEmailConfirmRedirectUrl();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
          data: { full_name: form.name.trim() },
        },
      });
      if (error) {
        toast.error(formatAuthUserFacingMessage(error));
        return;
      }
      const sessionMissing = !data.session;
      toast.success(sessionMissing ? "Check your email to confirm your account, then sign in." : "Account created!");
      navigate({ to: "/" });
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-6 py-10">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gradient">GameBonus</span>
        </div>

        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-muted-foreground mt-1">Join and start earning bonuses</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {[
            { k: "name" as const, label: "Full Name", icon: User, type: "text", placeholder: "John Doe" },
            { k: "email" as const, label: "Email", icon: Mail, type: "email", placeholder: "you@example.com" },
            { k: "password" as const, label: "Password", icon: Lock, type: "password", placeholder: "•••••••• (min 6 chars)" },
          ].map((f) => (
            <div key={f.k}>
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <div className="mt-1 flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary">
                <f.icon className="w-4 h-4 text-muted-foreground" />
                <input type={f.type} required minLength={f.k === "password" ? 6 : undefined} value={form[f.k]} onChange={update(f.k)} placeholder={f.placeholder} className="bg-transparent flex-1 outline-none text-sm" />
              </div>
            </div>
          ))}

          <button disabled={busy} type="submit" className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60">
            {busy ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account? <Link to="/login" className="text-primary-glow font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
