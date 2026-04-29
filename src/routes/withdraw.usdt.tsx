import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";

export const Route = createFileRoute("/withdraw/usdt")({
  head: () => ({ meta: [{ title: "Withdraw USDT — GameBonus" }] }),
  component: WithdrawUsdt,
});

function WithdrawUsdt() {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  return (
    <MobileShell>
      <PageHeader title="Withdraw USDT (TRC20)" back="/withdraw" />
      <StepIndicator step={1} />
      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Amount (USDT)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
          <p className="text-xs text-muted-foreground mt-1">Available: <span className="text-primary-glow">$653.00</span></p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">USDT (TRC20) Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter TRC20 address" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none font-mono" />
        </div>

        <div className="bg-card border border-border rounded-xl p-3 flex gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
          <p>Minimum withdrawal amount is <span className="text-primary-glow font-semibold">1000 USDT</span></p>
        </div>

        <button onClick={() => navigate({ to: "/deposit/pending" })} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow">Next</button>
      </div>
    </MobileShell>
  );
}
