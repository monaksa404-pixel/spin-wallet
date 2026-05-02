import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Coins, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/withdraw/")({
  head: () => ({ meta: [{ title: "Withdraw — GameBonus" }] }),
  component: WithdrawPage,
});

const MIN_WITHDRAW = 1000;

const methods = [
  { to: "/withdraw/usdt", icon: Coins, title: "USDT (TRC20)", desc: "Withdraw via USDT" },
  { to: "/withdraw/bank", icon: Landmark, title: "Bank Withdrawal", desc: "Withdraw via Bank" },
] as const;

type WithdrawRow = {
  id: string;
  method: string;
  amount: number;
  status: string;
};

function methodLabel(method: string): string {
  return method === "usdt" ? "USDT (TRC20)" : "Bank";
}

function WithdrawPage() {
  const { user, loading } = useAuth();
  const [recent, setRecent] = useState<WithdrawRow[]>([]);

  useEffect(() => {
    if (!user) {
      setRecent([]);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("withdrawals")
        .select("id, method, amount, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);
      setRecent((data ?? []) as WithdrawRow[]);
    })();
  }, [user]);

  return (
    <MobileShell>
      <PageHeader title="Withdraw" />
      <div className="px-4 py-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground mb-3">Choose Withdrawal Method</p>
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
          <p className="text-center text-xs text-muted-foreground mt-3">
            Minimum withdrawal:{" "}
            <span className="text-primary-glow font-semibold">{MIN_WITHDRAW} USD</span> (same for USDT)
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Recent Withdrawals</p>
          </div>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            {!user && !loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary-glow font-semibold">
                  Sign in
                </Link>{" "}
                to see withdrawals
              </div>
            )}
            {user && recent.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No withdrawals yet</div>
            )}
            {recent.map((r) => {
              const color =
                r.status === "approved"
                  ? "text-success bg-success/15"
                  : r.status === "rejected"
                    ? "text-destructive bg-destructive/15"
                    : "text-warning bg-warning/15";
              return (
                <div key={r.id} className="flex items-center justify-between p-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs shrink-0">
                      {methodLabel(r.method)[0]}
                    </div>
                    <span className="text-sm truncate">{methodLabel(r.method)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">${Number(r.amount).toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${color}`}>{r.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
