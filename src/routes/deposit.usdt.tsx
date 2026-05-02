import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Info } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDepositSettings } from "@/hooks/useDepositSettings";
import { toast } from "sonner";

export const Route = createFileRoute("/deposit/usdt")({
  head: () => ({ meta: [{ title: "USDT Deposit — GameBonus" }] }),
  component: UsdtDeposit,
});

function UsdtDeposit() {
  const [amount, setAmount] = useState("");
  const [senderRef, setSenderRef] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const dep = useDepositSettings();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      navigate({ to: "/login" });
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("deposits").insert({
      user_id: u.user.id,
      method: "usdt",
      requested_amount: amt,
      usdt_tx_address: senderRef.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Submitted! Pending admin review.");
    navigate({ to: "/deposit/pending" });
  };

  const usdEq = amount ? Number(amount).toFixed(2) : "0.00";

  return (
    <MobileShell>
      <PageHeader title="USDT (TRC20) Deposit" back="/deposit" />
      <StepIndicator step={2} />
      <div className="px-4 space-y-4 pb-4">
        <p className="text-sm text-muted-foreground">Send USDT (TRC20) to the address below</p>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Amount (USDT)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="Enter amount"
            className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">You will get</p>
          <p className="text-xl font-bold mt-1">{usdEq} USD</p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">TRC20 Wallet Address</label>
          <div className="mt-1 flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3">
            <p className="text-[11px] font-mono break-all flex-1 leading-snug">{dep.usdt_trc20_address}</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(dep.usdt_trc20_address);
                toast.success("Copied");
              }}
              className="text-primary-glow shrink-0"
              aria-label="Copy address"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Your TRC20 address / TX hash (optional)</label>
          <input
            value={senderRef}
            onChange={(e) => setSenderRef(e.target.value)}
            placeholder="Wallet you sent from or transaction hash"
            className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary outline-none"
          />
        </div>

        <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-3 flex gap-2 text-xs">
          <Info className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            After sending, tap <span className="text-primary-glow font-semibold">I Have Sent</span>. An admin will verify and credit your balance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60"
        >
          {busy ? "Submitting..." : "I Have Sent"}
        </button>
      </div>
    </MobileShell>
  );
}
