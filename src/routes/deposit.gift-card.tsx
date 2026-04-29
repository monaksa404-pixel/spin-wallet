import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Info } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";

export const Route = createFileRoute("/deposit/gift-card")({
  head: () => ({ meta: [{ title: "Gift Card Deposit — GameBonus" }] }),
  component: GiftCardDeposit,
});

const cards = [
  { id: "razer", name: "Razer Gold", bg: "from-green-500 to-emerald-700", label: "Razer Gold" },
  { id: "itunes", name: "iTunes", bg: "from-pink-500 to-purple-600", label: "iTunes" },
  { id: "stc", name: "STC", bg: "from-purple-600 to-indigo-700", label: "STC" },
  { id: "mobily", name: "Mobily", bg: "from-cyan-500 to-blue-600", label: "Mobily" },
  { id: "lebara", name: "Lebara", bg: "from-orange-500 to-red-600", label: "Lebara" },
];

function GiftCardDeposit() {
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const navigate = useNavigate();

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
          <p className="text-sm text-muted-foreground mb-3">Select Gift Card</p>
          <div className="grid grid-cols-5 gap-2">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-[10px] font-bold text-white p-1 text-center border-2 transition ${selected === c.id ? "border-primary-glow scale-105 shadow-glow" : "border-transparent"}`}
              >
                {c.label}
              </button>
            ))}
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
          <p>Please enter valid code. Code will be checked manually.</p>
        </div>

        <button onClick={submit} disabled={!selected || !code.trim()} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-50 disabled:shadow-none">
          Submit
        </button>
      </div>
    </MobileShell>
  );
}
