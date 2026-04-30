import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

export const Route = createFileRoute("/withdraw/usdt")({
  head: () => ({ meta: [{ title: "Withdraw USDT — GameBonus" }] }),
  component: WithdrawUsdt,
});

function WithdrawUsdt() {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);

  const submit = async () => {
    const amt = Number(amount);
    if (amt < 1000) { toast.error("Minimum withdrawal is 1000 USDT"); return; }
    if (!address.trim()) { toast.error("Enter your TRC20 address"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      _method: "usdt",
      _amount: amt,
      _usdt_address: address.trim(),
      _account_name: null,
      _account_number: null,
      _iban: null,
      _bank_name: null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal requested! Awaiting admin approval.");
    navigate({ to: "/wallet" });
  };

  return (
    <MobileShell>
      <PageHeader title="Withdraw USDT (TRC20)" back="/withdraw" />
      <StepIndicator step={1} />
      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Amount (USDT)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Enter amount" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
          <p className="text-xs text-muted-foreground mt-1">Available: <span className="text-primary-glow">${(wallet?.balance ?? 0).toFixed(2)}</span></p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">USDT (TRC20) Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter TRC20 address" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none font-mono" />
        </div>

        <div className="bg-card border border-border rounded-xl p-3 flex gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
          <p>Minimum withdrawal amount is <span className="text-primary-glow font-semibold">1000 USDT</span></p>
        </div>

        <button onClick={submit} disabled={busy} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60">
          {busy ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </MobileShell>
  );
}
