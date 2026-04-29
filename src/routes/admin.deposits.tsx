import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Eye } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/deposits")({
  head: () => ({ meta: [{ title: "Deposits — Admin" }] }),
  component: AdminDeposits,
});

type Status = "Pending" | "Approved" | "Rejected";
const initial: { id: string; user: string; method: string; amount: string; ref: string; time: string; status: Status }[] = [
  { id: "D-2041", user: "Ahmed Ali", method: "Razer Gold", amount: "$100.00", ref: "RZ-9823-AABB", time: "2m ago", status: "Pending" },
  { id: "D-2040", user: "Sara K.", method: "USDT (TRC20)", amount: "$500.00", ref: "TXID 0x9a..f3", time: "10m ago", status: "Approved" },
  { id: "D-2039", user: "Mohammed R.", method: "Al Rajhi Bank", amount: "$250.00", ref: "Slip #4421", time: "25m ago", status: "Pending" },
  { id: "D-2038", user: "Layla H.", method: "iTunes", amount: "$50.00", ref: "X4F-AAQ2-PP", time: "1h ago", status: "Rejected" },
  { id: "D-2037", user: "Omar Z.", method: "STC", amount: "$30.00", ref: "STC-1029", time: "2h ago", status: "Pending" },
];

function AdminDeposits() {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<"All" | Status>("Pending");
  const filtered = rows.filter((r) => tab === "All" || r.status === tab);

  const setStatus = (id: string, s: Status) => setRows(rows.map((r) => (r.id === id ? { ...r, status: s } : r)));

  return (
    <AdminShell title="Deposit Requests">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["Pending", "Approved", "Rejected", "All"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "bg-gradient-primary shadow-glow" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {t} <span className="ml-1 text-xs opacity-70">({rows.filter((r) => t === "All" || r.status === t).length})</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-card-elevated/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.user}</td>
                  <td className="px-4 py-3">{r.method}</td>
                  <td className="px-4 py-3 font-semibold">{r.amount}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.ref}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.time}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button className="p-1.5 rounded-lg hover:bg-muted" title="View"><Eye className="w-4 h-4" /></button>
                      {r.status === "Pending" && (
                        <>
                          <button onClick={() => setStatus(r.id, "Approved")} className="p-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25" title="Approve"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setStatus(r.id, "Rejected")} className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25" title="Reject"><X className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">No requests in this tab</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
