import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, Phone, Sparkles } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — GameBonus" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/" });
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
        <p className="text-sm text-muted-foreground mt-1">Join and get a welcome bonus</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {[
            { k: "name" as const, label: "Full Name", icon: User, type: "text", placeholder: "John Doe" },
            { k: "email" as const, label: "Email", icon: Mail, type: "email", placeholder: "you@example.com" },
            { k: "phone" as const, label: "Phone", icon: Phone, type: "tel", placeholder: "+966 ..." },
            { k: "password" as const, label: "Password", icon: Lock, type: "password", placeholder: "••••••••" },
          ].map((f) => (
            <div key={f.k}>
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <div className="mt-1 flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary">
                <f.icon className="w-4 h-4 text-muted-foreground" />
                <input type={f.type} required value={form[f.k]} onChange={update(f.k)} placeholder={f.placeholder} className="bg-transparent flex-1 outline-none text-sm" />
              </div>
            </div>
          ))}

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="accent-primary" /> I agree to the Terms & Privacy Policy
          </label>

          <button type="submit" className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow">Create Account</button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Already have an account? <Link to="/login" className="text-primary-glow font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
