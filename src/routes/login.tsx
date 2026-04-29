import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — GameBonus" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend-only stub; backend wires later
    if (form.email === "admin@gamebonus.app") navigate({ to: "/admin" });
    else navigate({ to: "/" });
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

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-primary" /> Remember me</label>
            <button type="button" className="text-primary-glow">Forgot password?</button>
          </div>

          <button type="submit" className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow">Sign In</button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px bg-border flex-1" /> OR <div className="h-px bg-border flex-1" />
        </div>

        <button className="w-full bg-card border border-border rounded-xl py-3 text-sm font-medium hover:border-primary transition">Continue with Google</button>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Don't have an account? <Link to="/signup" className="text-primary-glow font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
