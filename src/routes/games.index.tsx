import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, ArrowLeftRight } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { GAMES, fmtCurrency, COINS_PER_USDT } from "@/lib/games";
import { CurrencySelect } from "@/components/CurrencySelect";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/games/")({
  head: () => ({ meta: [{ title: "Games — GameBonus" }] }),
  component: GamesHub,
});

function GamesHub() {
  const { user, loading } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [usdtIn, setUsdtIn] = useState("");
  const [coinsIn, setCoinsIn] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [loading, user, navigate]);

  const toCoins = async () => {
    const v = Number(usdtIn);
    if (!v || v <= 0) return toast.error("Enter a USDT amount");
    setBusy(true);
    const { error } = await supabase.rpc("convert_to_coins", { _usdt: v });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`+${(v * COINS_PER_USDT).toLocaleString()} coins`); setUsdtIn(""); }
  };
  const toUsdt = async () => {
    const v = Number(coinsIn);
    if (!v || v <= 0) return toast.error("Enter coins");
    setBusy(true);
    const { error } = await supabase.rpc("convert_to_usdt", { _coins: v });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`+${(v / COINS_PER_USDT).toFixed(2)} USDT`); setCoinsIn(""); }
  };

  return (
    <MobileShell>
      <PageHeader title="Games" />
      <div className="px-4 py-4 space-y-5">
        <div className="bg-gradient-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">{fmtCurrency((wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0), currency)}</p>
            </div>
            <CurrencySelect />
          </div>
          <div className="flex items-center justify-between bg-background/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-warning" />
              <span className="text-lg font-bold">{Number(wallet?.coins ?? 0).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">coins</span>
            </div>
            <span className="text-[10px] text-muted-foreground">1 USDT = 100 coins</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-primary-glow" /> Convert</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input type="number" inputMode="decimal" value={usdtIn} onChange={(e) => setUsdtIn(e.target.value)} placeholder="USDT amount" className="bg-input border border-border rounded-lg px-3 py-2 text-sm" />
            <button disabled={busy} onClick={toCoins} className="bg-gradient-primary px-4 rounded-lg text-xs font-semibold disabled:opacity-50">→ Coins</button>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input type="number" inputMode="numeric" value={coinsIn} onChange={(e) => setCoinsIn(e.target.value)} placeholder="Coins amount" className="bg-input border border-border rounded-lg px-3 py-2 text-sm" />
            <button disabled={busy} onClick={toUsdt} className="bg-card-elevated border border-border px-4 rounded-lg text-xs font-semibold disabled:opacity-50">→ USDT</button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-3">Choose a game</p>
          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((g) => (
              <Link key={g.id} to={g.path} className="bg-gradient-card border border-border rounded-2xl p-4 hover:border-primary transition shadow-card">
                <div className="text-4xl mb-2">{g.emoji}</div>
                <p className="text-sm font-bold">{g.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{g.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
