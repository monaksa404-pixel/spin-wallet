import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

export const Route = createFileRoute("/withdraw/bank")({
  head: () => ({ meta: [{ title: "Bank Withdrawal — GameBonus" }] }),
  component: BankWithdraw,
});

function BankWithdraw() {
  const [form, setForm] = useState({ name: "", number: "", iban: "", bank: "Al Rajhi Bank", amount: "" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    const amt = Number(form.amount);
    if (amt < 1000) { toast.error("Minimum withdrawal is 1000 USD"); return; }
    if (!form.name.trim() || !form.number.trim() || !form.bank) { toast.error("Fill all required fields"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      _method: "bank",
      _amount: amt,
      _usdt_address: null,
      _account_name: form.name.trim(),
      _account_number: form.number.trim(),
      _iban: form.iban.trim() || null,
      _bank_name: form.bank,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal requested! Awaiting admin approval.");
    navigate({ to: "/wallet" });
  };

  return (
    <MobileShell>
      <PageHeader title="Bank Withdrawal" back="/withdraw" />
      <StepIndicator step={1} />
      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Account Holder Name</label>
          <input value={form.name} onChange={update("name")} placeholder="Enter name" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Account Number</label>
          <input value={form.number} onChange={update("number")} placeholder="Enter account number" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">IBAN</label>
          <input value={form.iban} onChange={update("iban")} placeholder="SA.. (optional)" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none font-mono" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Bank Name</label>
          <select value={form.bank} onChange={update("bank")} className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none">
            <option>Al Rajhi Bank</option>
            <option>SNB</option>
            <option>Riyad Bank</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Amount (USD)</label>
          <input value={form.amount} onChange={update("amount")} type="number" placeholder="Enter amount" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
          <p className="text-xs text-muted-foreground mt-1">Available: <span className="text-primary-glow">${(wallet?.balance ?? 0).toFixed(2)}</span> · Minimum: 1000 USD</p>
        </div>

        <button onClick={submit} disabled={busy} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60">
          {busy ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </MobileShell>
  );
}
