import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, CreditCard, Coins, Gift, Landmark, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";

export const Route = createFileRoute("/deposit/")({
  head: () => ({ meta: [{ title: "Deposit — GameBonus" }] }),
  component: DepositPage,
});

const methods = [
  { to: "/deposit/gift-card", icon: CreditCard, title: "Gift Card", desc: "Deposit with Gift Card" },
  { to: "/deposit/usdt", icon: Coins, title: "USDT (TRC20)", desc: "Deposit with USDT" },
  { to: "/deposit/bank", icon: Landmark, title: "Al Rajhi Bank", desc: "Deposit with Bank" },
] as const;

type DepositRow = {
  id: string;
  method: string;
  requested_amount: number | null;
  amount: number | null;
  status: string;
  gift_card_brand: string | null;
};

function methodLabel(method: string): string {
  switch (method) {
    case "gift_card":
      return "Gift Card";
    case "usdt":
      return "USDT (TRC20)";
    case "bank":
      return "Al Rajhi Bank";
    default:
      return method;
  }
}

function amountLabel(r: DepositRow): string {
  const v = r.amount ?? r.requested_amount;
  if (v == null && r.method === "gift_card") return "Pending value";
  if (v == null) return "—";
  return `$${Number(v).toFixed(2)}`;
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "bg-success/15 text-success"
      : status === "rejected"
        ? "bg-destructive/15 text-destructive"
        : "bg-warning/15 text-warning";
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${cls}`}>{status}</span>;
}

function DepositPage() {
  const { user, loading } = useAuth();
  const [recent, setRecent] = useState<DepositRow[]>([]);

  useEffect(() => {
    if (!user) {
      setRecent([]);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("deposits")
        .select("id, method, requested_amount, amount, status, gift_card_brand")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);
      setRecent((data ?? []) as DepositRow[]);
    })();
  }, [user]);

  return (
    <MobileShell>
      <PageHeader title="Deposit" />
      <div className="px-4 py-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground mb-3">Choose Deposit Method</p>
          <div className="space-y-3">
            {methods.map((m) => (
              <Link key={m.to} to={m.to} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:border-primary transition">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <m.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          {user && (
            <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Your balances</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-primary-glow" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Balance</p>
                    <p className="text-xl font-bold truncate">{fmtUsd(wallet?.balance)}</p>
                  </div>
                </div>
                <div className="flex gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-primary-glow" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Bonus</p>
                    <p className="text-xl font-bold text-primary-glow truncate">{fmtUsd(wallet?.bonus_balance)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">From admin</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Recent Deposits</p>
          </div>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {!user && !loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary-glow font-semibold">
                  Sign in
                </Link>{" "}
                to see your deposits
              </div>
            )}
            {user && recent.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No deposits yet</div>
            )}
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs shrink-0">
                    {methodLabel(r.method)[0]}
                  </div>
                  <span className="text-sm truncate">
                    {r.method === "gift_card" && r.gift_card_brand ? r.gift_card_brand : methodLabel(r.method)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold">{amountLabel(r)}</span>
                  <StatusPill status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
