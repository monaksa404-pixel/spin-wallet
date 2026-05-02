import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isBootstrapAdminEmail } from "@/lib/admin-bootstrap";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — GameBonus" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const u = data.user!;
    let isAdmin = isBootstrapAdminEmail(u.email);
    if (!isAdmin) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      isAdmin = (roles ?? []).some((r) => r.role === "admin");
    }
    navigate({ to: isAdmin ? "/admin" : "/" });
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md px-6 py-10 flex flex-col">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gradient">GameBonus</span>
        </div>

        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to continue earning bonuses</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <div className="mt-1 flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="bg-transparent flex-1 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <div className="mt-1 flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <input type={show ? "text" : "password"} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="bg-transparent flex-1 outline-none text-sm" />
              <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button disabled={busy} type="submit" className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60">
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Don't have an account? <Link to="/signup" className="text-primary-glow font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
