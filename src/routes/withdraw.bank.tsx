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

const BANK_OPTIONS = ["Al Rajhi Bank", "SNB", "Riyad Bank"] as const;

export const Route = createFileRoute("/withdraw/bank")({
  head: () => ({ meta: [{ title: "Bank Withdrawal — GameBonus" }] }),
  component: BankWithdraw,
});

function BankWithdraw() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", number: "", iban: "", bank: "Al Rajhi Bank", amount: "" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { wallet } = useWallet(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const amtNum = Number(form.amount);
  const bal = (wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0);

  const validateStep1 = () => {
    if (!amtNum || amtNum < MIN) {
      toast.error(`Minimum withdrawal is ${MIN} USD`);
      return false;
    }
    if (amtNum > bal) {
      toast.error("Amount exceeds available balance");
      return false;
    }
    if (!form.name.trim() || !form.number.trim() || !form.bank) {
      toast.error("Fill account holder name and account number");
      return false;
    }
    if (!form.iban.trim()) {
      toast.error("Enter IBAN");
      return false;
    }
    return true;
  };

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      _method: "bank",
      _amount: amtNum,
      _usdt_address: "",
      _account_name: form.name.trim(),
      _account_number: form.number.trim(),
      _iban: form.iban.trim(),
      _bank_name: form.bank,
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
      <PageHeader title="Bank Withdrawal" back="/withdraw" />
      <StepIndicator step={step} total={3} />

      <div className="px-4 space-y-4 pb-4">
        {step === 1 && (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Account Holder Name</label>
              <input
                value={form.name}
                onChange={update("name")}
                placeholder="Enter name"
                className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Account Number</label>
              <input
                value={form.number}
                onChange={update("number")}
                placeholder="Enter account number"
                className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bank Name</label>
              <select
                value={form.bank}
                onChange={update("bank")}
                className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">IBAN</label>
              <input
                value={form.iban}
                onChange={update("iban")}
                placeholder="SA.."
                className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount (USD)</label>
              <input
                value={form.amount}
                onChange={update("amount")}
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-primary-glow shrink-0" />
                Available: <span className="text-primary-glow font-semibold">${bal.toFixed(2)}</span> · Minimum: {MIN}{" "}
                USD
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
              <p className="font-semibold text-primary-glow">Confirm bank withdrawal</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">${amtNum.toFixed(2)} USD</span>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Beneficiary</p>
                <p className="mt-1">{form.name.trim()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Bank / Account</p>
                <p className="mt-1 font-mono text-xs">
                  {form.bank} · {form.number.trim()}
                </p>
                <p className="font-mono text-xs mt-1">{form.iban.trim()}</p>
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
