import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet as WalletIcon, Gift, ArrowDownToLine, ArrowUpFromLine, Sparkles, Coins, AlarmClock, CircleAlert } from "lucide-react";
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

type Tx = {
  id: string;
  kind: string;
  amount: number;
  description: string | null;
  created_at: string;
  withdrawal_status?: string | null;
  deposit_status?: string | null;
  failure_reason?: string | null;
};

function txKindLabel(t: Tx) {
  if (t.kind === "balance_expiry") return "Balance expired";
  if (t.kind === "bonus") return "Bonus";
  if (t.kind === "withdrawal" && t.withdrawal_status) {
    if (t.withdrawal_status === "approved") return "Withdrawal · Approved";
    if (t.withdrawal_status === "rejected") return "Withdrawal · Failed";
    if (t.withdrawal_status === "pending") return "Withdrawal · Pending";
  }
  if (t.kind === "deposit" && t.deposit_status) {
    if (t.deposit_status === "approved") return "Deposit · Approved";
    if (t.deposit_status === "rejected") return "Deposit · Failed";
    if (t.deposit_status === "pending") return "Deposit · Pending";
  }
  return t.kind;
}

const iconFor = (t: Tx) => {
  if (t.kind === "deposit") {
    if (t.deposit_status === "rejected") return CircleAlert;
    return ArrowDownToLine;
  }
  if (t.kind === "withdrawal") {
    if (t.withdrawal_status === "rejected") return CircleAlert;
    return ArrowUpFromLine;
  }
  if (t.kind === "balance_expiry") return AlarmClock;
  return Sparkles;
};

function rowStatusAccent(t: Tx): "success" | "destructive" | "warning" | null {
  if (t.kind === "withdrawal" && t.withdrawal_status) {
    if (t.withdrawal_status === "approved") return "success";
    if (t.withdrawal_status === "rejected") return "destructive";
    if (t.withdrawal_status === "pending") return "warning";
  }
  if (t.kind === "deposit" && t.deposit_status) {
    if (t.deposit_status === "approved") return "success";
    if (t.deposit_status === "rejected") return "destructive";
    if (t.deposit_status === "pending") return "warning";
  }
  return null;
}

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
            const Icon = iconFor(t);
            const accent = rowStatusAccent(t);
            const positive = t.amount >= 0;
            const amountClass = accent
              ? accent === "success"
                ? "text-emerald-400"
                : accent === "destructive"
                  ? "text-red-400"
                  : "text-amber-400"
              : positive
                ? "text-success"
                : "text-destructive";
            const ringClass = accent
              ? accent === "success"
                ? "border border-emerald-500/30 bg-emerald-500/10"
                : accent === "destructive"
                  ? "border border-red-500/30 bg-red-500/10"
                  : "border border-amber-500/30 bg-amber-500/10"
              : "bg-primary/15";
            return (
              <div key={t.id} className="flex items-start gap-3 p-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ringClass}`}>
                  <Icon className={`h-5 w-5 ${accent === "success" ? "text-emerald-300" : accent === "destructive" ? "text-red-300" : accent === "warning" ? "text-amber-300" : "text-primary-glow"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${accent === "success" ? "text-emerald-200" : accent === "destructive" ? "text-red-200" : accent === "warning" ? "text-amber-200" : ""}`}>
                    {txKindLabel(t)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description ?? new Date(t.created_at).toLocaleString()}</p>
                  {((t.kind === "withdrawal" && t.withdrawal_status === "rejected") || (t.kind === "deposit" && t.deposit_status === "rejected")) &&
                    t.failure_reason && (
                    <p className="mt-1.5 text-[11px] font-medium text-red-300/95 leading-snug border-l-2 border-red-500/50 pl-2">{t.failure_reason}</p>
                  )}
                </div>
                <div className="shrink-0 text-right pt-0.5">
                  <p className={`text-sm font-bold tabular-nums ${amountClass}`}>
                    {positive ? "+" : ""}${t.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
