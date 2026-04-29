import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";

export const Route = createFileRoute("/deposit/gift-card")({
  head: () => ({ meta: [{ title: "Gift Card Deposit — GameBonus" }] }),
  component: GiftCardDeposit,
});

// Drop card images into public/images/cards/ — filenames referenced via `image` field.
// Add up to ~20 entries; carousel shows 5 at a time with arrows.
type Card = { id: string; name: string; image?: string; bg: string };

const cards: Card[] = [
  { id: "razer", name: "Razer Gold", bg: "from-green-500 to-emerald-700" },
  { id: "itunes", name: "iTunes", bg: "from-pink-500 to-purple-600" },
  { id: "stc", name: "STC", bg: "from-purple-600 to-indigo-700" },
  { id: "mobily", name: "Mobily", bg: "from-cyan-500 to-blue-600" },
  { id: "lebara", name: "Lebara", bg: "from-orange-500 to-red-600" },
  { id: "amazon", name: "Amazon", bg: "from-yellow-500 to-orange-600" },
  { id: "google", name: "Google Play", bg: "from-emerald-500 to-teal-700" },
  { id: "steam", name: "Steam", bg: "from-slate-700 to-slate-900" },
  { id: "playstation", name: "PlayStation", bg: "from-blue-600 to-indigo-800" },
  { id: "xbox", name: "Xbox", bg: "from-green-600 to-green-900" },
];

const PAGE = 5;

function GiftCardDeposit() {
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE));
  const visible = cards.slice(page * PAGE, page * PAGE + PAGE);

  const submit = () => {
    if (!selected || !code.trim()) return;
    navigate({ to: "/deposit/pending" });
  };

  return (
    <MobileShell>
      <PageHeader title="Gift Card Deposit" back="/deposit" />
      <StepIndicator step={1} />
      <div className="px-4 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Select Gift Card</p>
            <p className="text-xs text-muted-foreground">{page + 1} / {totalPages}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-12 rounded-lg bg-card border border-border flex items-center justify-center disabled:opacity-30 hover:border-primary transition shrink-0"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-5 gap-2 flex-1">
              {visible.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br ${c.bg} flex items-center justify-center text-[10px] font-bold text-white p-1 text-center border-2 transition ${selected === c.id ? "border-primary-glow scale-105 shadow-glow" : "border-transparent"}`}
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    c.name
                  )}
                </button>
              ))}
              {Array.from({ length: PAGE - visible.length }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-[3/4]" />
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-12 rounded-lg bg-card border border-border flex items-center justify-center disabled:opacity-30 hover:border-primary transition shrink-0"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Enter Gift Card Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter gift card code"
            className="mt-2 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-3 flex gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
          <p>Please enter valid code. Code will be checked manually within 2 hours.</p>
        </div>

        <button onClick={submit} disabled={!selected || !code.trim()} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-50 disabled:shadow-none">
          Submit
        </button>
      </div>
    </MobileShell>
  );
}
