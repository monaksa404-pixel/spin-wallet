import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gift } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { GameHeader } from "@/components/GameHeader";
import { BetSelector, useBet } from "@/components/BetSelector";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useGamePlay } from "@/hooks/useGamePlay";
import { STANDARD_PRIZES, pickWeightedPrizeIndex } from "@/lib/games";

export const Route = createFileRoute("/games/lucky-box")({
  head: () => ({ meta: [{ title: "Lucky Box — GameBonus" }] }),
  component: LuckyBox,
});

function LuckyBox() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { play, busy } = useGamePlay("lucky_box");
  const { bet, setBet } = useBet(50);
  const [revealed, setRevealed] = useState<Record<number, number | null>>({});

  const pickBox = async (idx: number) => {
    if (busy || revealed[idx] !== undefined) return;
    if ((wallet?.coins ?? 0) < bet) return;
    const winIdx = pickWeightedPrizeIndex(STANDARD_PRIZES);
    setRevealed((r) => ({ ...r, [idx]: winIdx }));
    await play(bet, STANDARD_PRIZES[winIdx]);
    setTimeout(() => setRevealed({}), 2200);
  };

  return (
    <MobileShell>
      <GameHeader title="Lucky Box" />
      <div className="px-4 py-5 space-y-5">
        <div className="text-center">
          <p className="text-xl font-bold">Choose Your Lucky Box</p>
          <p className="text-xs text-muted-foreground mt-1">Pick a box and win amazing rewards</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => {
            const win = revealed[i];
            const prize = win != null ? STANDARD_PRIZES[win] : null;
            return (
              <button
                key={i}
                onClick={() => pickBox(i)}
                disabled={busy || (wallet?.coins ?? 0) < bet}
                className="aspect-square bg-gradient-card border-2 border-primary/40 rounded-2xl flex flex-col items-center justify-center relative shadow-card transition hover:scale-105 disabled:opacity-50"
                style={prize ? { borderColor: prize.color, background: `linear-gradient(135deg, ${prize.color}40, transparent)` } : undefined}
              >
                {prize ? (
                  <span className="text-xl font-extrabold" style={{ color: prize.color }}>{prize.label}</span>
                ) : (
                  <>
                    <Gift className="w-10 h-10 text-primary-glow" />
                    <span className="absolute bottom-1.5 right-2 w-5 h-5 rounded-full bg-background/70 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <BetSelector value={bet} onChange={setBet} />

        <p className="text-center text-xs text-muted-foreground">Tap any box to reveal your prize · {bet} coins per pick</p>
      </div>
    </MobileShell>
  );
}
