import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react";
import { AdminShell, StatCard, StatusPill } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GameBonus" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0, pending: 0 });
  const [recentDep, setRecentDep] = useState<any[]>([]);
  const [recentWd, setRecentWd] = useState<any[]>([]);

  const load = async () => {
    const [users, deps, wds, pendD, pendW, pendS, recD, recW] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("amount").eq("kind", "deposit"),
      supabase.from("transactions").select("amount").eq("kind", "withdrawal"),
      supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("spin_rewards").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("deposits").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
      supabase.from("withdrawals").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(5),
    ]);
    setStats({
      users: users.count ?? 0,
      deposits: (deps.data ?? []).reduce((s, t) => s + Number(t.amount || 0), 0),
      withdrawals: Math.abs((wds.data ?? []).reduce((s, t) => s + Number(t.amount || 0), 0)),
      pending: (pendD.count ?? 0) + (pendW.count ?? 0) + (pendS.count ?? 0),
    });
    setRecentDep(recD.data ?? []);
    setRecentWd(recW.data ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "spin_rewards" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <AdminShell title="Dashboard Overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={String(stats.users)} />
        <StatCard label="Total Deposits" value={`$${stats.deposits.toFixed(2)}`} accent="text-success" />
        <StatCard label="Total Withdrawals" value={`$${stats.withdrawals.toFixed(2)}`} accent="text-primary-glow" />
        <StatCard label="Pending Requests" value={String(stats.pending)} sub="Needs review" accent="text-warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <RecentTable title="Recent Deposits" rows={recentDep.map((r) => ({ user: r.profiles?.full_name ?? "—", method: r.method, amount: `$${Number(r.amount ?? r.requested_amount ?? 0).toFixed(2)}`, status: r.status, time: new Date(r.created_at).toLocaleTimeString() }))} />
        <RecentTable title="Recent Withdrawals" rows={recentWd.map((r) => ({ user: r.profiles?.full_name ?? "—", method: r.method, amount: `$${Number(r.amount).toFixed(2)}`, status: r.status, time: new Date(r.created_at).toLocaleTimeString() }))} />
      </div>
    </AdminShell>
  );
}

function RecentTable({ title, rows }: { title: string; rows: { user: string; method: string; amount: string; status: string; time: string }[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No records yet</p>}
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
