import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MoreVertical, Ban, CheckCircle2 } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

const seed = Array.from({ length: 12 }).map((_, i) => ({
  id: `U${1000 + i}`,
  name: ["Ahmed Ali", "Sara K.", "Mohammed R.", "Layla H.", "Omar Z.", "Nora F.", "Khalid M.", "Fatima S."][i % 8],
  email: `user${i + 1}@mail.com`,
  balance: `$${(Math.random() * 2000).toFixed(2)}`,
  joined: "2025-04-1" + (i % 9),
  status: (i % 7 === 0 ? "Banned" : "Active") as "Active" | "Banned",
}));

function AdminUsers() {
  const [q, setQ] = useState("");
  const filtered = seed.filter((u) => (u.name + u.email + u.id).toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminShell title="Users">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, ID..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <button className="bg-gradient-primary px-4 py-2 rounded-xl text-sm font-semibold shadow-glow">Export</button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Balance</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-card-elevated/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-xs">{u.name[0]}</div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.id}</td>
                  <td className="px-4 py-3 font-semibold">{u.balance}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                  <td className="px-4 py-3"><StatusPill status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {u.status === "Active" ? (
                        <button className="p-1.5 rounded-lg hover:bg-destructive/15 text-destructive" title="Ban"><Ban className="w-4 h-4" /></button>
                      ) : (
                        <button className="p-1.5 rounded-lg hover:bg-success/15 text-success" title="Activate"><CheckCircle2 className="w-4 h-4" /></button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-muted"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
