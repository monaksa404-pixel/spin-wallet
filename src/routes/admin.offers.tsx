import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/offers")({
  head: () => ({ meta: [{ title: "Offers — Admin" }] }),
  component: AdminOffers,
});

const seed = [
  { id: "1", title: "Welcome Bonus", desc: "100% bonus on first deposit", reward: "+100%", active: true, expires: "2026-05-30" },
  { id: "2", title: "Weekend Cashback", desc: "10% cashback on weekend losses", reward: "10%", active: true, expires: "2026-05-15" },
  { id: "3", title: "Refer a Friend", desc: "Get $25 per referral", reward: "$25", active: false, expires: "2026-06-01" },
];

function AdminOffers() {
  const [items, setItems] = useState(seed);
  const toggle = (id: string) => setItems(items.map((i) => (i.id === id ? { ...i, active: !i.active } : i)));
  const remove = (id: string) => setItems(items.filter((i) => i.id !== id));

  return (
    <AdminShell title="Offers & Promotions">
      <div className="flex justify-end mb-4">
        <button className="bg-gradient-primary px-4 py-2 rounded-xl text-sm font-semibold shadow-glow flex items-center gap-2"><Plus className="w-4 h-4" /> New Offer</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((o) => (
          <div key={o.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{o.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-gradient-primary font-bold">{o.reward}</span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Expires {o.expires}</p>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={o.active} onChange={() => toggle(o.id)} className="accent-primary" />
                {o.active ? <span className="text-success">Active</span> : <span className="text-muted-foreground">Inactive</span>}
              </label>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 bg-card-elevated border border-border rounded-lg py-2 text-xs flex items-center justify-center gap-1 hover:border-primary"><Edit className="w-3 h-3" /> Edit</button>
              <button onClick={() => remove(o.id)} className="bg-destructive/15 text-destructive border border-destructive/30 rounded-lg py-2 px-3 text-xs flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
