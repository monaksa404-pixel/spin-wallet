import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { GameHeader } from "@/components/GameHeader";
import { BetSelector, useBet } from "@/components/BetSelector";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useGamePlay } from "@/hooks/useGamePlay";
import { STANDARD_PRIZES, pickWeightedPrizeIndex } from "@/lib/games";

export const Route = createFileRoute("/games/luck-wheel")({
  head: () => ({ meta: [{ title: "Luck Wheel — GameBonus" }] }),
  component: LuckWheel,
});

function LuckWheel() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { play, busy } = useGamePlay("luck_wheel");
  const { bet, setBet } = useBet(10);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const slices = STANDARD_PRIZES;
  const sliceAngle = 360 / slices.length;

  const spin = async () => {
    if (spinning || busy) return;
    if ((wallet?.coins ?? 0) < bet) return;
    setSpinning(true);
    const winIdx = pickWeightedPrizeIndex(slices);
    // Pointer is at top (-90°). Slice i center on wheel is at (-90 + (i + ½)·sliceAngle)° before rotation.
    // Rotate clockwise so that slice lines up with the pointer; increment matches weighted prize index.
    const spins = 6;
    setRotation((r) => r + 360 * spins + (winIdx + 0.5) * sliceAngle);
    setTimeout(async () => {
      await play(bet, slices[winIdx]);
      setSpinning(false);
    }, 4100);
  };

  return (
    <MobileShell>
      <GameHeader title="Luck Wheel" />
      <div className="px-4 py-5 space-y-5">
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
          <button onClick={spin} disabled={spinning || busy} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-primary border-4 border-background font-bold text-sm shadow-glow disabled:opacity-60">
            SPIN
          </button>
        </div>

        <BetSelector value={bet} onChange={setBet} />

        <button onClick={spin} disabled={spinning || busy || (wallet?.coins ?? 0) < bet} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-50">
          {spinning ? "Spinning..." : `Spin Now (${bet} coins)`}
        </button>
      </div>
    </MobileShell>
  );
}
