import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

export const Route = createFileRoute("/spin")({
  head: () => ({ meta: [{ title: "Spin Wheel — GameBonus" }] }),
  component: SpinPage,
});

type Slice = { label: string; color: string; kind: "multiplier" | "percent" | "fixed"; value: number };

const slices: Slice[] = [
  { label: "5X",  color: "#a855f7", kind: "multiplier", value: 5 },
  { label: "10%", color: "#3b82f6", kind: "percent",    value: 10 },
  { label: "1%",  color: "#f59e0b", kind: "percent",    value: 1 },
  { label: "1X",  color: "#ec4899", kind: "multiplier", value: 1 },
  { label: "5%",  color: "#10b981", kind: "percent",    value: 5 },
  { label: "15%", color: "#06b6d4", kind: "percent",    value: 15 },
  { label: "$5",  color: "#22c55e", kind: "fixed",      value: 5 },
  { label: "5%",  color: "#8b5cf6", kind: "percent",    value: 5 },
];

function compute(prize: Slice, balance: number): number {
  if (prize.kind === "multiplier") return Math.max(0, balance * (prize.value - 1)); // 5X means win 4x more
  if (prize.kind === "percent") return Math.max(0, balance * (prize.value / 100));
  return prize.value;
}

function SpinPage() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const sliceAngle = 360 / slices.length;

  const spin = async () => {
    if (spinning || !user) return;
    setSpinning(true);
    const winIdx = Math.floor(Math.random() * slices.length);
    const target = rotation + 360 * 6 + (360 - (winIdx * sliceAngle + sliceAngle / 2));
    setRotation(target);

    setTimeout(async () => {
      setSpinning(false);
      const prize = slices[winIdx];
      const balance = wallet?.balance ?? 0;
      const computed = Number(compute(prize, balance).toFixed(2));
      const { error } = await supabase.from("spin_rewards").insert({
        user_id: user.id,
        prize_label: prize.label,
        prize_kind: prize.kind,
        prize_value: prize.value,
        balance_at_spin: balance,
        computed_amount: computed,
      });
      if (error) toast.error(error.message);
      else toast.success(`You won ${prize.label} (~$${computed.toFixed(2)}). Awaiting admin approval.`);
    }, 4100);
  };

  return (
    <MobileShell>
      <PageHeader title="Spin Wheel" />
      <div className="px-4 py-4 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-3 text-center text-xs text-muted-foreground">
          Current balance: <span className="text-primary-glow font-bold">${(wallet?.balance ?? 0).toFixed(2)}</span> · Rewards credited after admin approval
        </div>

        <div className="relative mx-auto w-72 h-72">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary-glow" />
          </div>
          <div className="w-full h-full rounded-full border-4 border-primary shadow-glow relative overflow-hidden transition-transform ease-out" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: "4s" }}>
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {slices.map((s, i) => {
                const start = i * sliceAngle - 90;
                const end = start + sliceAngle;
                const x1 = 100 + 100 * Math.cos((start * Math.PI) / 180);
                const y1 = 100 + 100 * Math.sin((start * Math.PI) / 180);
                const x2 = 100 + 100 * Math.cos((end * Math.PI) / 180);
                const y2 = 100 + 100 * Math.sin((end * Math.PI) / 180);
                const mid = start + sliceAngle / 2;
                const tx = 100 + 60 * Math.cos((mid * Math.PI) / 180);
                const ty = 100 + 60 * Math.sin((mid * Math.PI) / 180);
                return (
                  <g key={i}>
                    <path d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`} fill={s.color} />
                    <text x={tx} y={ty} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid + 90} ${tx} ${ty})`}>
                      {s.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <button onClick={spin} disabled={spinning} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-primary border-4 border-background font-bold text-sm shadow-glow disabled:opacity-60">
            SPIN
          </button>
        </div>

        <button onClick={spin} disabled={spinning} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-50">
          {spinning ? "Spinning..." : "Spin Now"}
        </button>
      </div>
    </MobileShell>
  );
}
