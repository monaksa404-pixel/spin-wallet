import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";

export const Route = createFileRoute("/withdraw/bank")({
  head: () => ({ meta: [{ title: "Bank Withdrawal — GameBonus" }] }),
  component: BankWithdraw,
});

function BankWithdraw() {
  const [form, setForm] = useState({ name: "", number: "", bank: "", amount: "" });
  const navigate = useNavigate();
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

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
          <label className="text-xs text-muted-foreground">Bank Name</label>
          <select value={form.bank} onChange={update("bank")} className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none">
            <option value="">Select Bank</option>
            <option>Al Rajhi Bank</option>
            <option>SNB</option>
            <option>Riyad Bank</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Amount (USD)</label>
          <input value={form.amount} onChange={update("amount")} placeholder="Enter amount" className="mt-1 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none" />
          <p className="text-xs text-primary-glow mt-1">Minimum withdrawal: 1000 USD</p>
        </div>

        <button onClick={() => navigate({ to: "/deposit/pending" })} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow">Next</button>
      </div>
    </MobileShell>
  );
}
