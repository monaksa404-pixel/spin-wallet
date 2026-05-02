import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEPOSIT_BANK_DETAILS } from "@/lib/deposit-config";
import { toast } from "sonner";

export const Route = createFileRoute("/deposit/bank")({
  head: () => ({ meta: [{ title: "Bank Deposit — GameBonus" }] }),
  component: BankDeposit,
});

function BankDeposit() {
  const [amount, setAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerAccountNumber, setPayerAccountNumber] = useState("");
  const [payerIban, setPayerIban] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!payerName.trim() || !payerAccountNumber.trim() || !payerIban.trim()) {
      toast.error("Enter your account name, account number, and IBAN");
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
      method: "bank",
      requested_amount: amt,
      payer_account_name: payerName.trim(),
      payer_account_number: payerAccountNumber.trim(),
      payer_iban: payerIban.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Submitted! Pending admin review.");
    navigate({ to: "/deposit/pending" });
  };

  const d = DEPOSIT_BANK_DETAILS;

  return (
    <MobileShell>
      <PageHeader title="Bank Deposit (Al Rajhi)" back="/deposit" />
      <StepIndicator step={2} />
      <div className="px-4 space-y-4 pb-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-primary-glow">Bank Details</p>
          <div>
            <p className="text-xs text-muted-foreground">Bank Name</p>
            <p className="text-sm font-semibold">{d.bankName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Name</p>
            <p className="text-sm font-semibold">{d.accountName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Number</p>
            <p className="text-sm font-semibold tracking-wide">{d.accountNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">IBAN</p>
            <p className="text-sm font-semibold tracking-wide font-mono">{d.iban}</p>
          </div>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">After payment, submit your details and amount below.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Your account holder name</label>
          <input
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="As shown on your bank account"
            className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Your account number</label>
          <input
            value={payerAccountNumber}
            onChange={(e) => setPayerAccountNumber(e.target.value)}
            placeholder="Enter account number"
            className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Your IBAN</label>
          <input
            value={payerIban}
            onChange={(e) => setPayerIban(e.target.value)}
            placeholder="SA.."
            className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Amount (USD)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="Enter amount"
            className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60"
        >
          {busy ? "Submitting..." : "Next"}
        </button>
      </div>
    </MobileShell>
  );
}
