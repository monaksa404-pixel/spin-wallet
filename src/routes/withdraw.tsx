import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Coins, Landmark } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/withdraw")({
  head: () => ({ meta: [{ title: "Withdraw — GameBonus" }] }),
  component: WithdrawPage,
});

const methods = [
  { to: "/withdraw/usdt", icon: Coins, title: "USDT (TRC20)", desc: "Withdraw via USDT" },
  { to: "/withdraw/bank", icon: Landmark, title: "Bank Withdrawal", desc: "Withdraw via Bank" },
] as const;

const recent = [
  { method: "USDT (TRC20)", amount: "$1000.00", status: "Pending", color: "text-warning bg-warning/15" },
  { method: "Al Rajhi Bank", amount: "$1500.00", status: "Approved", color: "text-success bg-success/15" },
  { method: "USDT (TRC20)", amount: "$2000.00", status: "Rejected", color: "text-destructive bg-destructive/15" },
];

function WithdrawPage() {
  return (
    <MobileShell>
      <PageHeader title="Withdraw" />
      <div className="px-4 py-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground mb-3">Choose Withdrawal Method</p>
          <div className="space-y-3">
            {methods.map((m) => (
              <Link key={m.to} to={m.to} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:border-primary transition">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center"><m.icon className="w-6 h-6" /></div>
                <div className="flex-1">
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">Minimum withdrawal: <span className="text-primary-glow font-semibold">1000 USDT</span></p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Recent Withdrawals</p>
            <button className="text-xs text-primary-glow">View All</button>
          </div>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {recent.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs">{r.method[0]}</div>
                  <span className="text-sm">{r.method}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{r.amount}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${r.color}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
