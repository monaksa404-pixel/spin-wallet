import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/deposit/bank")({
  head: () => ({ meta: [{ title: "Bank Deposit — GameBonus" }] }),
  component: BankDeposit,
});

function BankDeposit() {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const details = [
    { label: "Bank Name", value: "Al Rajhi Bank" },
    { label: "Account Name", value: "GameBonus" },
    { label: "Account Number", value: "1234 5678 9012 3456" },
    { label: "IBAN", value: "SA12 3456 7890 1234 5678 9012" },
  ];

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { navigate({ to: "/login" }); return; }
    const { error } = await supabase.from("deposits").insert({
      user_id: u.user.id,
      method: "bank",
      requested_amount: amt,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Submitted! Pending admin review.");
    navigate({ to: "/deposit/pending" });
  };

  return (
    <MobileShell>
      <PageHeader title="Bank Deposit (Al Rajhi)" back="/deposit" />
      <StepIndicator step={1} />
      <div className="px-4 space-y-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-primary-glow">Bank Details</p>
          {details.map((d) => (
            <div key={d.label}>
              <p className="text-xs text-muted-foreground">{d.label}</p>
              <p className="text-sm font-semibold">{d.value}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">After payment, submit the amount below.</p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Amount (USD)</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Enter amount" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
        </div>

        <button onClick={submit} disabled={busy} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-60">
          {busy ? "Submitting..." : "Submit"}
        </button>
      </div>
    </MobileShell>
  );
}
