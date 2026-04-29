import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin/spin")({
  head: () => ({ meta: [{ title: "Spin Rewards — Admin" }] }),
  component: AdminSpin,
});

type Slice = { id: string; label: string; value: number; probability: number; color: string };

const seed: Slice[] = [
  { id: "1", label: "$5", value: 5, probability: 30, color: "#a855f7" },
  { id: "2", label: "$10", value: 10, probability: 20, color: "#7c3aed" },
  { id: "3", label: "$25", value: 25, probability: 15, color: "#ec4899" },
  { id: "4", label: "$50", value: 50, probability: 10, color: "#f59e0b" },
  { id: "5", label: "$100", value: 100, probability: 5, color: "#10b981" },
  { id: "6", label: "Try Again", value: 0, probability: 20, color: "#475569" },
];

function AdminSpin() {
  const [slices, setSlices] = useState<Slice[]>(seed);
  const total = slices.reduce((s, x) => s + x.probability, 0);

  const update = (id: string, patch: Partial<Slice>) => setSlices(slices.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => setSlices(slices.filter((s) => s.id !== id));
  const add = () => setSlices([...slices, { id: String(Date.now()), label: "New", value: 0, probability: 5, color: "#a855f7" }]);

  return (
    <AdminShell title="Spin Wheel Rewards">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Configure prize slices and win probabilities. Total probability should equal <span className={total === 100 ? "text-success" : "text-warning"}>100%</span> (current: {total}%).</p>
        <div className="flex gap-2">
          <button onClick={add} className="bg-card border border-border px-3 py-2 rounded-xl text-sm flex items-center gap-2 hover:border-primary"><Plus className="w-4 h-4" /> Add Slice</button>
          <button className="bg-gradient-primary px-4 py-2 rounded-xl text-sm font-semibold shadow-glow flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Color</th>
              <th className="text-left px-4 py-3">Label</th>
              <th className="text-left px-4 py-3">Value (USD)</th>
              <th className="text-left px-4 py-3">Probability (%)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {slices.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <input type="color" value={s.color} onChange={(e) => update(s.id, { color: e.target.value })} className="w-10 h-8 rounded bg-transparent" />
                </td>
                <td className="px-4 py-3"><input value={s.label} onChange={(e) => update(s.id, { label: e.target.value })} className="bg-input border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary w-32" /></td>
                <td className="px-4 py-3"><input type="number" value={s.value} onChange={(e) => update(s.id, { value: Number(e.target.value) })} className="bg-input border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary w-24" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input type="number" value={s.probability} onChange={(e) => update(s.id, { probability: Number(e.target.value) })} className="bg-input border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary w-20" />
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                      <div className="h-full bg-gradient-primary" style={{ width: `${s.probability}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
