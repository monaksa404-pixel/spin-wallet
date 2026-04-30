import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/spin")({
  head: () => ({ meta: [{ title: "Spin Rewards — Admin" }] }),
  component: AdminSpin,
});

type Row = {
  id: string; prize_label: string; prize_kind: string; prize_value: number;
  balance_at_spin: number; computed_amount: number; status: string; created_at: string;
  profiles: { full_name: string | null } | null;
};

function AdminSpin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"All" | "pending" | "approved" | "rejected">("pending");

  const load = async () => {
    const { data } = await supabase.from("spin_rewards").select("*, profiles(full_name)").order("created_at", { ascending: false });
    setRows((data ?? []) as any);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-spin").on("postgres_changes", { event: "*", schema: "public", table: "spin_rewards" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = rows.filter((r) => tab === "All" || r.status === tab);
  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_spin", { _id: id });
    if (error) toast.error(error.message); else toast.success("Approved");
  };
  const reject = async (id: string) => {
    const { error } = await supabase.rpc("reject_spin", { _id: id });
    if (error) toast.error(error.message); else toast.success("Rejected");
  };

  return (
    <AdminShell title="Spin Wheel Rewards">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["pending", "approved", "rejected", "All"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? "bg-gradient-primary shadow-glow" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {t} <span className="ml-1 text-xs opacity-70">({rows.filter((r) => t === "All" || r.status === t).length})</span>
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Prize</th>
              <th className="text-left px-4 py-3">Balance @ spin</th>
              <th className="text-left px-4 py-3">Computed reward</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-3 font-bold text-primary-glow">{r.prize_label}</td>
                <td className="px-4 py-3">${Number(r.balance_at_spin).toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold">${Number(r.computed_amount).toFixed(2)}</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3">
                  {r.status === "pending" && (
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => approve(r.id)} className="p-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25"><Check className="w-4 h-4" /></button>
                      <button onClick={() => reject(r.id)} className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No spins</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
