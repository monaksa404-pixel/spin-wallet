import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Info } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/deposit/usdt")({
  head: () => ({ meta: [{ title: "USDT Deposit — GameBonus" }] }),
  component: UsdtDeposit,
});

function UsdtDeposit() {
  const [amount, setAmount] = useState("");
  const [txAddr, setTxAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const address = "TVuAsd8Pq3X8h7Nqk9R2uJxpF39gYg7uZv";

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { navigate({ to: "/login" }); return; }
    const { error } = await supabase.from("deposits").insert({
      user_id: u.user.id,
      method: "usdt",
      requested_amount: amt,
      usdt_tx_address: txAddr.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Submitted! Pending admin review.");
    navigate({ to: "/deposit/pending" });
  };

  return (
    <MobileShell>
      <PageHeader title="USDT (TRC20) Deposit" back="/deposit" />
      <StepIndicator step={1} />
      <div className="px-4 space-y-4">
        <p className="text-sm text-muted-foreground">Send USDT (TRC20) to the address below</p>

        <div>
          <label className="text-xs text-muted-foreground">Amount (USDT)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Enter amount" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">You will get</p>
          <p className="text-xl font-bold mt-1">{amount ? Number(amount).toFixed(2) : "0.00"} USD</p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">TRC20 Wallet Address (send to)</label>
          <div className="mt-1 flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3">
            <p className="text-xs font-mono break-all flex-1">{address}</p>
            <button onClick={() => { navigator.clipboard?.writeText(address); toast.success("Copied"); }} className="text-primary-glow"><Copy className="w-4 h-4" /></button>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Your sender address (optional)</label>
          <input value={txAddr} onChange={(e) => setTxAddr(e.target.value)} placeholder="TRC20 address you sent from / TX hash" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary outline-none" />
        </div>

        <div className="bg-card border border-border rounded-xl p-3 flex gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
          <p>After sending, click <span className="text-primary-glow font-semibold">"I Have Sent"</span></p>
        </div>

        <button onClick={submit} disabled={busy} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60">
          {busy ? "Submitting..." : "I Have Sent"}
        </button>
      </div>
    </MobileShell>
  );
}
