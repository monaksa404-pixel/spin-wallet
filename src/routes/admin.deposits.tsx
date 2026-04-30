import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/deposits")({
  head: () => ({ meta: [{ title: "Deposits — Admin" }] }),
  component: AdminDeposits,
});

type Status = "pending" | "approved" | "rejected";
type Row = {
  id: string; user_id: string; method: string; amount: number | null; requested_amount: number | null;
  gift_card_brand: string | null; gift_card_code: string | null; usdt_tx_address: string | null;
  status: Status; created_at: string; profiles: { full_name: string | null } | null;
};

function AdminDeposits() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"All" | Status>("pending");
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("deposits").select("*, profiles(full_name)").order("created_at", { ascending: false });
    setRows((data ?? []) as any);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-deps")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = rows.filter((r) => tab === "All" || r.status === tab);

  const approve = async (r: Row) => {
    const amt = Number(amounts[r.id] ?? r.requested_amount ?? 0);
    if (!amt || amt <= 0) { toast.error("Enter approval amount"); return; }
    const { error } = await supabase.rpc("approve_deposit", { _id: r.id, _amount: amt });
    if (error) toast.error(error.message); else toast.success("Approved & credited");
  };
  const reject = async (r: Row) => {
    const note = window.prompt("Rejection reason (optional)") ?? "";
    const { error } = await supabase.rpc("reject_deposit", { _id: r.id, _note: note });
    if (error) toast.error(error.message); else toast.success("Rejected");
  };

  return (
    <AdminShell title="Deposit Requests">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["pending", "approved", "rejected", "All"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? "bg-gradient-primary shadow-glow" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {t} <span className="ml-1 text-xs opacity-70">({rows.filter((r) => t === "All" || r.status === t).length})</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Details</th>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-left px-4 py-3">Approve $</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-card-elevated/40">
                  <td className="px-4 py-3 font-medium">{r.profiles?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{r.method.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[220px] truncate">
                    {r.method === "gift_card" && `${r.gift_card_brand}: ${r.gift_card_code}`}
                    {r.method === "usdt" && (r.usdt_tx_address || "—")}
                    {r.method === "bank" && "Al Rajhi Bank slip"}
                  </td>
                  <td className="px-4 py-3">{r.requested_amount ? `$${Number(r.requested_amount).toFixed(2)}` : "—"}</td>
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <input type="number" placeholder={r.requested_amount ? String(r.requested_amount) : "0"} value={amounts[r.id] ?? ""} onChange={(e) => setAmounts({ ...amounts, [r.id]: e.target.value })} className="w-24 bg-input border border-border rounded-lg px-2 py-1 outline-none focus:border-primary" />
                    ) : (
                      r.amount ? `$${Number(r.amount).toFixed(2)}` : "—"
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === "pending" && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => approve(r)} className="p-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25" title="Approve"><Check className="w-4 h-4" /></button>
                        <button onClick={() => reject(r)} className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25" title="Reject"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">No requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
