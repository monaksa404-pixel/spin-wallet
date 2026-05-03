import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COINS_PER_USDT, type Prize, type GameId } from "@/lib/games";

export function useGamePlay(game: GameId) {
  const [busy, setBusy] = useState(false);

  const play = async (betCoins: number, prize: Prize) => {
    if (busy) return false;
    setBusy(true);
    const { error } = await supabase.rpc("play_game", {
      _game: game,
      _bet_coins: betCoins,
      _prize_label: prize.label,
      _prize_kind: prize.kind,
      _prize_value: prize.value,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    const betUsdt = betCoins / COINS_PER_USDT;
    const won = prize.kind === "multiplier" ? betUsdt * prize.value : betUsdt * (prize.value / 100);
    if (won <= 0)
      toast.message("No win this time. Better luck next!");
    else toast.success(`You won ${prize.label} (~$${won.toFixed(2)} USDT) — credited to balance automatically.`);
    return true;
  };

  return { play, busy };
}
