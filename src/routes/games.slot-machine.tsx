import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { GameHeader } from "@/components/GameHeader";
import { BetSelector, useBet } from "@/components/BetSelector";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useGamePlay } from "@/hooks/useGamePlay";
import { STANDARD_PRIZES } from "@/lib/games";

export const Route = createFileRoute("/games/slot-machine")({
  head: () => ({ meta: [{ title: "Slot Machine — GameBonus" }] }),
  component: SlotMachine,
});

// Each reel cycles through prize labels.
const symbols = STANDARD_PRIZES.map((p) => p.label);

function SlotMachine() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { play, busy } = useGamePlay("slot_machine");
  const { bet, setBet } = useBet(50);
  const [reels, setReels] = useState<[number, number, number]>([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);

  const pull = async () => {
    if (spinning || busy) return;
    if ((wallet?.coins ?? 0) < bet) return;
    setSpinning(true);
    const winIdx = Math.floor(Math.random() * STANDARD_PRIZES.length);
    // visual ticker
    let ticks = 0;
    const interval = setInterval(() => {
      setReels([
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
      ]);
      ticks++;
      if (ticks > 15) {
        clearInterval(interval);
        setReels([winIdx, winIdx, winIdx]);
        setTimeout(async () => {
          await play(bet, STANDARD_PRIZES[winIdx]);
          setSpinning(false);
        }, 400);
      }
    }, 80);
  };

  return (
    <MobileShell>
      <GameHeader title="Slot Machine" />
      <div className="px-4 py-5 space-y-5">
        <div className="bg-gradient-card border-4 border-primary rounded-3xl p-5 shadow-glow">
          <p className="text-center text-warning font-bold text-xs tracking-widest mb-1">★ JACKPOT ★</p>
          <p className="text-center text-3xl font-extrabold text-warning mb-4">5,000 COINS</p>
          <div className="grid grid-cols-3 gap-2 bg-background/60 p-3 rounded-2xl border-2 border-warning/40">
            {reels.map((r, i) => (
              <div key={i} className="aspect-square flex items-center justify-center bg-card-elevated rounded-xl text-2xl font-extrabold" style={{ color: STANDARD_PRIZES[r].color }}>
                {symbols[r]}
              </div>
            ))}
          </div>
        </div>

        <BetSelector value={bet} onChange={setBet} options={[10, 50, 100, 500]} />

        <div className="grid grid-cols-3 gap-2">
          <button disabled className="bg-card border border-border py-3 rounded-xl text-sm font-bold text-muted-foreground">BET −</button>
          <button onClick={pull} disabled={spinning || busy || (wallet?.coins ?? 0) < bet} className="bg-gradient-primary py-3 rounded-xl text-sm font-bold shadow-glow disabled:opacity-50">
            {spinning ? "..." : "SPIN"}
          </button>
          <button disabled className="bg-card border border-border py-3 rounded-xl text-sm font-bold text-muted-foreground">BET +</button>
        </div>
      </div>
    </MobileShell>
  );
}
