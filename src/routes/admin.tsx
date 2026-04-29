import { createFileRoute } from "@tanstack/react-router";
import { Users, ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp } from "lucide-react";
import { AdminShell, StatCard, StatusPill } from "@/components/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GameBonus" }] }),
  component: AdminDashboard,
});

const recentDeposits = [
  { user: "Ahmed Ali", method: "Razer Gold", amount: "$100.00", status: "Pending" as const, time: "2m ago" },
  { user: "Sara K.", method: "USDT (TRC20)", amount: "$500.00", status: "Approved" as const, time: "10m ago" },
  { user: "Mohammed R.", method: "Al Rajhi Bank", amount: "$250.00", status: "Pending" as const, time: "25m ago" },
  { user: "Layla H.", method: "iTunes", amount: "$50.00", status: "Rejected" as const, time: "1h ago" },
];

const recentWithdrawals = [
  { user: "Omar Z.", method: "USDT (TRC20)", amount: "$1200.00", status: "Pending" as const, time: "5m ago" },
  { user: "Nora F.", method: "Al Rajhi Bank", amount: "$1500.00", status: "Approved" as const, time: "30m ago" },
  { user: "Khalid M.", method: "USDT (TRC20)", amount: "$2000.00", status: "Pending" as const, time: "1h ago" },
];

function AdminDashboard() {
  return (
    <AdminShell title="Dashboard Overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value="2,847" sub="+124 this week" />
        <StatCard label="Total Deposits" value="$48,290" sub="+12% vs last month" accent="text-success" />
        <StatCard label="Total Withdrawals" value="$31,540" sub="+8% vs last month" accent="text-primary-glow" />
        <StatCard label="Pending Requests" value="14" sub="Needs review" accent="text-warning" />
      </div>

      <div className="grid lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Revenue Trend</h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-success" /> +18.2%</span>
          </div>
          <div className="h-48 flex items-end gap-2">
            {[40, 65, 50, 80, 70, 90, 60, 85, 75, 95, 80, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-primary rounded-t-md opacity-80 hover:opacity-100 transition" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold">Quick Stats</h3>
          {[
            { icon: Users, label: "Active today", value: "1,204" },
            { icon: ArrowDownToLine, label: "Deposits today", value: "$3,420" },
            { icon: ArrowUpFromLine, label: "Withdrawals today", value: "$1,890" },
            { icon: Wallet, label: "House balance", value: "$16,750" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary-glow" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <RecentTable title="Recent Deposits" rows={recentDeposits} />
        <RecentTable title="Recent Withdrawals" rows={recentWithdrawals} />
      </div>
    </AdminShell>
  );
}

function RecentTable({ title, rows }: { title: string; rows: { user: string; method: string; amount: string; status: "Pending" | "Approved" | "Rejected"; time: string }[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">{title}</h3>
        <button className="text-xs text-primary-glow">View all</button>
      </div>
      <div className="divide-y divide-border">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between p-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-xs shrink-0">{r.user[0]}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.user}</p>
                <p className="text-xs text-muted-foreground truncate">{r.method} · {r.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold">{r.amount}</span>
              <StatusPill status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
