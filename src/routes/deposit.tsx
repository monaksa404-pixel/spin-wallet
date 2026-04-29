import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, CreditCard, Coins, Landmark } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/deposit")({
  head: () => ({ meta: [{ title: "Deposit — GameBonus" }] }),
  component: DepositPage,
});

const methods = [
  { to: "/deposit/gift-card", icon: CreditCard, title: "Gift Card", desc: "Deposit with Gift Card" },
  { to: "/deposit/usdt", icon: Coins, title: "USDT (TRC20)", desc: "Deposit with USDT" },
  { to: "/deposit/bank", icon: Landmark, title: "Al Rajhi Bank", desc: "Deposit with Bank" },
] as const;

const recent = [
  { method: "Razer Gold", amount: "$100.00", status: "Pending" },
  { method: "USDT (TRC20)", amount: "$200.00", status: "Approved" },
  { method: "Al Rajhi Bank", amount: "$300.00", status: "Pending" },
] as const;

function StatusPill({ status }: { status: string }) {
  const cls = status === "Approved" ? "bg-success/15 text-success" : status === "Rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning";
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}>{status}</span>;
}

function DepositPage() {
  return (
    <MobileShell>
      <PageHeader title="Deposit" />
      <div className="px-4 py-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground mb-3">Choose Deposit Method</p>
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
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Recent Deposits</p>
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
                  <StatusPill status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
