import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { GameHeader } from "@/components/GameHeader";
import { BetSelector, useBet } from "@/components/BetSelector";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useGamePlay } from "@/hooks/useGamePlay";
import { STANDARD_PRIZES } from "@/lib/games";

export const Route = createFileRoute("/games/bonus-drop")({
  head: () => ({ meta: [{ title: "Bonus Drop — GameBonus" }] }),
  component: BonusDrop;
});

function BonusDrop() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { play, busy } = useGamePlay("bonus_drop");
  const { bet, setBet } = useBet(50);
  const [coinPos, setCoinPos] = useState<{ x: number; y: number } | null>(null);
  const [winIdx, setWinIdx] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);

  const slots = STANDARD_PRIZES;

  const drop = async () => {
    if (dropping || busy) return;
    if ((wallet?.coins ?? 0) < bet) return;
    setDropping(true);
    setWinIdx(null);
    const idx = Math.floor(Math.random() * slots.length);
    // animate coin: start middle top, end at slot center
    const slotW = 100 / slots.length;
    const targetX = slotW * idx + slotW / 2;
    setCoinPos({ x: 50, y: 0 });
    requestAnimationFrame(() => setCoinPos({ x: targetX, y: 100 }));

    setTimeout(async () => {
      setWinIdx(idx);
      await play(bet, slots[idx]);
      setDropping(false);
      setTimeout(() => { setCoinPos(null); setWinIdx(null); }, 1500);
    }, 1800);
  };

  return (
    <MobileShell>
      <GameHeader title="Bonus Drop" />
      <div className="px-4 py-5 space-y-5">
        <p className="text-center text-xs text-muted-foreground">Drop the coin and win big bonuses</p>

        <div className="relative h-72 bg-gradient-card border-4 border-primary rounded-3xl overflow-hidden shadow-glow">
          {/* peg dots */}
          <div className="absolute inset-x-4 top-6 bottom-16 grid grid-rows-6 gap-3 opacity-40 pointer-events-none">
            {Array.from({ length: 6 }).map((_, r) => (
              <div key={r} className="flex justify-around" style={{ paddingLeft: r % 2 ? "5%" : 0, paddingRight: r % 2 ? 0 : "5%" }}>
                {Array.from({ length: 7 }).map((_, c) => <span key={c} className="w-1.5 h-1.5 rounded-full bg-primary-glow" />)}
              </div>
            ))}
          </div>

          {/* coin */}
          {coinPos && (
            <div
              className="absolute w-7 h-7 rounded-full bg-warning border-2 border-yellow-300 flex items-center justify-center text-[10px] font-bold transition-all ease-in"
              style={{
                left: `calc(${coinPos.x}% - 14px)`,
                top: `calc(${coinPos.y}% - 14px)`,
                transitionDuration: "1.7s",
              }}
            >
              💰
            </div>
          )}

          {/* slots */}
          <div className="absolute bottom-0 inset-x-0 grid" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
            {slots.map((s, i) => (
              <div
                key={i}
                className={`text-center py-2 text-xs font-extrabold border-t-4 transition ${winIdx === i ? "scale-110 shadow-glow" : ""}`}
                style={{ background: s.color, color: "white", borderTopColor: winIdx === i ? "white" : s.color }}
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>

        <BetSelector value={bet} onChange={setBet} />

        <button onClick={drop} disabled={dropping || busy || (wallet?.coins ?? 0) < bet} className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-50">
          {dropping ? "Dropping..." : `Drop Now (${bet} coins)`}
        </button>
      </div>
    </MobileShell>
  );
}
