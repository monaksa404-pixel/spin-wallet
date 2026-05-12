import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

const MIN = 1000;

export const Route = createFileRoute("/withdraw/usdt")({
  head: () => ({ meta: [{ title: "Withdraw USDT — GameBonus" }] }),
  component: WithdrawUsdt,
});

function WithdrawUsdt() {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { wallet } = useWallet(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const amtNum = Number(amount);
  const bal = (wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0);

  const validateStep1 = () => {
    if (!amtNum || amtNum < MIN) {
      toast.error(`Minimum withdrawal is ${MIN} USDT`);
      return false;
    }
    if (amtNum > bal) {
      toast.error("Amount exceeds available balance");
      return false;
    }
    if (!address.trim()) {
      toast.error("Enter your TRC20 address");
      return false;
    }
    return true;
  };

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      _method: "usdt",
      _amount: amtNum,
      _usdt_address: address.trim(),
      _account_name: "",
      _account_number: "",
      _iban: "",
      _bank_name: "",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Withdrawal requested! Awaiting admin approval.");
    navigate({ to: "/wallet" });
  };

  return (
    <MobileShell>
      <PageHeader title="Withdraw USDT (TRC20)" back="/withdraw" />
      <StepIndicator step={step} total={3} />

      <div className="px-4 space-y-4 pb-4">
        {step === 1 && (
          <>
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
              <p className="text-xs text-muted-foreground mt-1">
                Available:{" "}
                <span className="text-primary-glow font-semibold">${bal.toFixed(2)}</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">USDT (TRC20) Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter TRC20 address"
                className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none font-mono"
              />
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3 flex gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
              <p>
                Minimum withdrawal is <span className="text-primary-glow font-semibold">{MIN} USDT</span>. Funds are
                held until an admin approves; then they are sent off-platform.
              </p>
            </div>

            <button
              type="button"
              onClick={() => validateStep1() && setStep(2)}
              className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow"
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-sm">
              <p className="font-semibold text-primary-glow">Confirm withdrawal</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">${amtNum.toFixed(2)} USDT</span>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Destination</p>
                <p className="font-mono text-xs break-all mt-1">{address.trim()}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl font-semibold border border-border bg-card"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit()}
                className="flex-[2] bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60"
              >
                {busy ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </>
        )}
      </div>
    </MobileShell>
  );
}
