import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Eye } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/withdrawals")({
  head: () => ({ meta: [{ title: "Withdrawals — Admin" }] }),
  component: AdminWithdrawals,
});

type Status = "Pending" | "Approved" | "Rejected";
const initial: { id: string; user: string; method: string; amount: string; dest: string; time: string; status: Status }[] = [
  { id: "W-1099", user: "Omar Z.", method: "USDT (TRC20)", amount: "$1200.00", dest: "TVu...7uZv", time: "5m ago", status: "Pending" },
  { id: "W-1098", user: "Nora F.", method: "Al Rajhi Bank", amount: "$1500.00", dest: "SA12 ... 9012", time: "30m ago", status: "Approved" },
  { id: "W-1097", user: "Khalid M.", method: "USDT (TRC20)", amount: "$2000.00", dest: "TXf...09KK", time: "1h ago", status: "Pending" },
  { id: "W-1096", user: "Fatima S.", method: "Al Rajhi Bank", amount: "$800.00", dest: "SA98 ... 4471", time: "3h ago", status: "Rejected" },
];

function AdminWithdrawals() {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<"All" | Status>("Pending");
  const filtered = rows.filter((r) => tab === "All" || r.status === tab);
  const setStatus = (id: string, s: Status) => setRows(rows.map((r) => (r.id === id ? { ...r, status: s } : r)));

  return (
    <AdminShell title="Withdrawal Requests">
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
                <th className="text-left px-4 py-3">Destination</th>
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
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.dest}</td>
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
