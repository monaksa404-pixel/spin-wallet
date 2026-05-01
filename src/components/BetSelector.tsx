import { useState } from "react";
import { Coins } from "lucide-react";

export function BetSelector({ value, onChange, options = [10, 50, 100, 500] }: { value: number; onChange: (v: number) => void; options?: number[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-2">Bet (coins)</p>
      <div className="grid grid-cols-4 gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition ${value === o ? "bg-gradient-primary border-transparent shadow-glow" : "bg-card border-border text-muted-foreground"}`}
          >
            <Coins className="w-3 h-3" /> {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function useBet(initial = 10) {
  const [bet, setBet] = useState(initial);
  return { bet, setBet };
}
