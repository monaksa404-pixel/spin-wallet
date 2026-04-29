import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wallet as WalletIcon, Gift, ArrowDownToLine, ArrowUpFromLine, Sparkles } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — GameBonus" }] }),
  component: WalletPage,
});

const txs = [
  { type: "Deposit", date: "12 May 2024, 10:30 AM", amount: "+$50.00", status: "Pending", icon: ArrowDownToLine },
  { type: "Bonus", date: "12 May 2024, 11:00 AM", amount: "+$200.00", status: "Approved", icon: Sparkles },
  { type: "Withdraw", date: "11 May 2024, 09:15 PM", amount: "-$1000.00", status: "Pending", icon: ArrowUpFromLine },
  { type: "Deposit", date: "11 May 2024, 08:45 PM", amount: "+$100.00", status: "Approved", icon: ArrowDownToLine },
];

function WalletPage() {
  const [filter, setFilter] = useState<"All" | "Deposit" | "Bonus" | "Withdraw">("All");
  const filtered = filter === "All" ? txs : txs.filter((t) => t.type === filter);

  return (
    <MobileShell>
      <PageHeader title="Wallet" />
      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <WalletIcon className="w-6 h-6 text-primary-glow mb-2" />
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">$653.00</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <Gift className="w-6 h-6 text-primary-glow mb-2" />
            <p className="text-xs text-muted-foreground">Bonus Balance</p>
            <p className="text-2xl font-bold">$150.00</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-1 grid grid-cols-4 gap-1">
          {(["All", "Deposit", "Bonus", "Withdraw"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`py-2 rounded-lg text-xs font-semibold transition ${filter === f ? "bg-gradient-primary shadow-glow" : "text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {filtered.map((t, i) => {
            const positive = t.amount.startsWith("+");
            return (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <t.icon className="w-5 h-5 text-primary-glow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t.type}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${positive ? "text-success" : "text-destructive"}`}>{t.amount}</p>
                  <p className={`text-xs ${t.status === "Approved" ? "text-success" : "text-warning"}`}>{t.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
