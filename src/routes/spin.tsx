import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { History } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/spin")({
  head: () => ({ meta: [{ title: "Spin Wheel — GameBonus" }] }),
  component: SpinPage,
});

const slices = [
  { label: "5X", color: "#a855f7" },
  { label: "10%", color: "#3b82f6" },
  { label: "1%", color: "#f59e0b" },
  { label: "1X", color: "#ec4899" },
  { label: "5%", color: "#10b981" },
  { label: "15%", color: "#06b6d4" },
  { label: "5%", color: "#22c55e" },
  { label: "5%", color: "#8b5cf6" },
];

function SpinPage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [available, setAvailable] = useState(5);

  const spin = () => {
    if (spinning || available <= 0) return;
    setSpinning(true);
    setAvailable((a) => a - 1);
    const target = rotation + 360 * 6 + Math.floor(Math.random() * 360);
    setRotation(target);
    setTimeout(() => setSpinning(false), 4000);
  };

  const sliceAngle = 360 / slices.length;

  return (
    <MobileShell>
      <PageHeader title="Spin Wheel" />
      <div className="px-4 py-4 space-y-6">
        <div className="flex justify-end">
          <button className="flex items-center gap-1 text-xs text-primary-glow"><History className="w-4 h-4" /> History</button>
        </div>

        <div className="relative mx-auto w-72 h-72">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary-glow" />
          </div>
          {/* Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-primary shadow-glow relative overflow-hidden transition-transform ease-out"
            style={{ transform: `rotate(${rotation}deg)`, transitionDuration: "4s" }}
          >
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
          {/* Center button */}
          <button
            onClick={spin}
            disabled={spinning || available <= 0}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-primary border-4 border-background font-bold text-sm shadow-glow disabled:opacity-60"
          >
            SPIN
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">🎯</div>
            <span className="text-sm">Available Spins</span>
          </div>
          <span className="text-2xl font-bold text-primary-glow">{available}</span>
        </div>

        <button onClick={spin} disabled={spinning || available <= 0} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-50">
          {spinning ? "Spinning..." : "Spin Now"}
        </button>
      </div>
    </MobileShell>
  );
}
