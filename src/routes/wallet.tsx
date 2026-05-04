import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet as WalletIcon, Gift, ArrowDownToLine, ArrowUpFromLine, Sparkles, Coins, AlarmClock } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { fmtCurrency } from "@/lib/games";
import { CurrencySelect } from "@/components/CurrencySelect";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet — GameBonus" }] }),
  component: WalletPage,
});

type Tx = { id: string; kind: string; amount: number; description: string | null; created_at: string };

function txKindLabel(kind: string) {
  if (kind === "balance_expiry") return "Balance expired";
  if (kind === "bonus") return "Bonus";
  return kind;
}

const iconFor = (kind: string) =>
  kind === "deposit"
    ? ArrowDownToLine
    : kind === "withdrawal"
      ? ArrowUpFromLine
      : kind === "balance_expiry"
        ? AlarmClock
        : Sparkles;

function WalletPage() {
  const { user } = useAuth();
  const { wallet } = useWallet(user?.id);
  const { currency } = useCurrency();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [filter, setFilter] = useState<"All" | "deposit" | "spin" | "withdrawal" | "balance_expiry">("All");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      setTxs((data ?? []) as Tx[]);
    };
    load();
    const channel = supabase.channel(`tx:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = filter === "All" ? txs : txs.filter((t) => t.kind === filter);

  return (
    <MobileShell>
      <PageHeader title="Wallet" />
      <div className="px-4 py-4 space-y-4">
        <div className="flex justify-end"><CurrencySelect /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <WalletIcon className="w-6 h-6 text-primary-glow mb-2" />
            <p className="text-xs text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">{fmtCurrency((wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0), currency)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">${((wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0)).toFixed(2)} USDT</p>
          </div>
          <div className="bg-gradient-card border border-border rounded-2xl p-4">
            <Gift className="w-6 h-6 text-primary-glow mb-2" />
            <p className="text-xs text-muted-foreground">Bonus Balance</p>
            <p className="text-2xl font-bold">{fmtCurrency(wallet?.bonus_balance ?? 0, currency)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <Coins className="w-6 h-6 text-warning mb-2" />
            <p className="text-xs text-muted-foreground">Game Coins</p>
            <p className="text-2xl font-bold">{Number(wallet?.coins ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Pending hold</p>
            <p className="text-2xl font-bold text-warning">{fmtCurrency(wallet?.pending_balance ?? 0, currency)}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-1 flex flex-wrap gap-1">
          {(["All", "deposit", "spin", "withdrawal", "balance_expiry"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex-1 min-w-[4.5rem] py-2 rounded-lg text-[11px] font-semibold capitalize transition ${filter === f ? "bg-gradient-primary shadow-glow" : "text-muted-foreground"}`}
            >
              {f === "balance_expiry" ? "Expiry" : f}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No transactions yet</p>}
          {filtered.map((t) => {
            const Icon = iconFor(t.kind);
            const positive = t.amount >= 0;
            return (
              <div key={t.id} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-glow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold capitalize">{txKindLabel(t.kind)}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.description ?? new Date(t.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${positive ? "text-success" : "text-destructive"}`}>{positive ? "+" : ""}${t.amount.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
