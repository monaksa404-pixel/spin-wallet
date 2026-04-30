import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

type Row = { id: string; full_name: string | null; status: string; created_at: string; balance: number; bonus_balance: number };

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: wallets } = await supabase.from("wallets").select("*");
    const wmap = new Map((wallets ?? []).map((w: any) => [w.user_id, w]));
    setRows((profs ?? []).map((p: any) => ({
      id: p.id, full_name: p.full_name, status: p.status, created_at: p.created_at,
      balance: Number(wmap.get(p.id)?.balance ?? 0),
      bonus_balance: Number(wmap.get(p.id)?.bonus_balance ?? 0),
    })));
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((u) => (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()) || u.id.includes(q));

  return (
    <AdminShell title="Users">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Balance</th>
              <th className="text-left px-4 py-3">Bonus</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-card-elevated/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-xs">{(u.full_name ?? "U")[0]}</div>
                    <div>
                      <p className="font-medium">{u.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">${u.balance.toFixed(2)}</td>
                <td className="px-4 py-3">${u.bonus_balance.toFixed(2)}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusPill status={u.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No users</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
