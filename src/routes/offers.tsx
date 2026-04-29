import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gift, Calendar, Flame } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/offers")({
  head: () => ({ meta: [{ title: "Offers & Deals — GameBonus" }] }),
  component: OffersPage,
});

const active = [
  { title: "Deposit $50", sub: "Get 5X Bonus", until: "20 May 2024", hot: true },
  { title: "Deposit $100", sub: "Get 6X Bonus", until: "25 May 2024", hot: false },
  { title: "Weekend Special", sub: "Get 4X Bonus", until: "19 May 2024", hot: false },
];

const past = [
  { title: "Easter Special", sub: "Got 3X Bonus", until: "10 April 2024" },
  { title: "Spring Deal", sub: "Got 2X Bonus", until: "01 April 2024" },
];

function OffersPage() {
  const [tab, setTab] = useState<"active" | "past">("active");
  const data = tab === "active" ? active : past;

  return (
    <MobileShell>
      <PageHeader title="Offers & Deals" />
      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-xl p-1 grid grid-cols-2 gap-1">
          {(["active", "past"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`py-2 rounded-lg text-sm font-semibold capitalize transition ${tab === t ? "bg-gradient-primary shadow-glow" : "text-muted-foreground"}`}>
              {t} Offers
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {data.map((o, i) => (
            <div key={i} className="bg-gradient-card border border-border rounded-2xl p-4 relative overflow-hidden">
              {"hot" in o && o.hot && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/15 px-2 py-1 rounded-md">
                  <Flame className="w-3 h-3" /> HOT
                </span>
              )}
              <p className="font-semibold">{o.title}</p>
              <p className="text-2xl font-extrabold text-gradient mt-1">{o.sub}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="w-3 h-3" /> Valid Till: {o.until}
              </div>
              <Gift className="absolute -bottom-3 -right-3 w-20 h-20 text-primary/20" />
            </div>
          ))}
        </div>

        <button className="w-full bg-card border border-border rounded-xl py-3 text-sm font-semibold text-primary-glow">View All Offers</button>
      </div>
    </MobileShell>
  );
}
