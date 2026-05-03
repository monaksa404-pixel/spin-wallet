import { Link } from "@tanstack/react-router";
import { ArrowLeft, Coins } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtCurrency } from "@/lib/games";
import { CurrencySelect } from "./CurrencySelect";

export function GameHeader({ title, back = "/games" }: { title: string; back?: string }) {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { currency } = useCurrency();
  return (
    <header className="px-4 py-3 border-b border-border space-y-3">
      <div className="flex items-center justify-between">
        <Link to={back} className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-bold uppercase tracking-wide">{title}</h1>
        <div className="w-9" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 bg-gradient-card border border-border rounded-xl px-3 py-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-warning" />
          <div>
            <p className="text-[9px] uppercase text-muted-foreground leading-none">Coins</p>
            <p className="text-sm font-bold leading-tight">{Number(wallet?.coins ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex-1 bg-gradient-card border border-border rounded-xl px-3 py-2">
          <p className="text-[9px] uppercase text-muted-foreground leading-none">Total Balance</p>
          <p className="text-sm font-bold leading-tight">{fmtCurrency((wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0), currency)}</p>
        </div>
        <CurrencySelect />
      </div>
    </header>
  );
}
