import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bell, Menu, Wallet, Gift, AlarmClock, ArrowDownToLine, ArrowUpFromLine, Gamepad2, Tag } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { CurrencySelect } from "@/components/CurrencySelect";
import { fmtCurrency } from "@/lib/games";
import { HomeOffersCarousel } from "@/components/HomeOffersCarousel";
import {
  BalanceExpiryTopBanner,
  BalanceExpiredBottomBar,
  DepositDeadlineBanner,
  MinWithdrawFooter,
  WithdrawQuickLink,
} from "@/components/BalanceExpiryBanners";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GameBonus — Play, Win & Redeem" },
      { name: "description", content: "Deposit, win and redeem rewards with GameBonus." },
    ],
  }),
  component: HomePage,
});

const fmt = (n: number) => `$${Number(n || 0).toFixed(2)}`;

function HomePage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { wallet, depositDeadlineAt, hasPendingDeposit } = useWallet(user?.id);
  const { currency } = useCurrency();

  const hasExpiredNotice = (wallet?.expired_balance_snapshot ?? 0) > 0;
  const deadlineMs = depositDeadlineAt ? new Date(depositDeadlineAt).getTime() : NaN;
  const showCountdown =
    !!depositDeadlineAt &&
    !Number.isNaN(deadlineMs) &&
    deadlineMs > Date.now() &&
    !hasExpiredNotice;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-4 py-4">
        <button className="w-10 h-10 rounded-lg bg-card flex items-center justify-center"><Menu className="w-5 h-5" /></button>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-foreground">Game</span><span className="text-primary-glow">Bonus</span>
          </h1>
          <p className="text-xs text-muted-foreground">Play, Win & Redeem</p>
        </div>
        <Link to="/profile" className="w-10 h-10 rounded-full bg-card flex items-center justify-center relative">
          <Bell className="w-5 h-5" />
        </Link>
      </header>

      {/* Sticky countdown bar — sits just below header, always visible while scrolling */}
      {showCountdown && <DepositDeadlineBanner deadlineAt={depositDeadlineAt} />}

      <div className="px-4 space-y-4">
        {hasExpiredNotice && (
          <BalanceExpiryTopBanner
            expiredSnapshot={wallet?.expired_balance_snapshot}
            missedDeadlineAt={wallet?.missed_deadline_at}
            balanceExpiredAt={wallet?.balance_expired_at}
          />
        )}

        {hasPendingDeposit && !depositDeadlineAt && !hasExpiredNotice && (
          <div className="rounded-xl border border-amber-600/55 bg-amber-950/30 px-3 py-3 text-xs text-amber-100/90 leading-snug">
            <p className="font-semibold text-amber-200 uppercase tracking-wide text-[10px]">Deposit pending</p>
            <p className="mt-1">Admin is reviewing your deposit — your balance is safe while it awaits approval.</p>
          </div>
        )}

        <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Balance</p>
              <p className="text-2xl font-bold">{fmtCurrency((wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0), currency)}</p>
              {hasExpiredNotice ? (
                <p className="text-[10px] text-red-400/90 mt-1 leading-snug">
                  Your previous balance of{" "}
                  <span className="font-semibold">${Number(wallet?.expired_balance_snapshot ?? 0).toFixed(2)}</span>{" "}
                  has expired and is no longer available.
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-1">{fmt((wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0))} USDT</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <WithdrawQuickLink disabled={hasExpiredNotice} />
              <CurrencySelect />
            </div>
          </div>
          <MinWithdrawFooter />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">Last 7 days bonus</p>
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary-glow" />
              <span className="text-xs text-muted-foreground uppercase">Bonus Balance</span>
            </div>
            <p className="text-2xl font-bold text-primary-glow">{fmt(wallet?.bonus_balance ?? 0)}</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlarmClock className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground uppercase">Pending</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{fmt(wallet?.pending_balance ?? 0)}</p>
          </div>
        </div>

        <HomeOffersCarousel />

        {hasExpiredNotice && (
          <BalanceExpiredBottomBar
            expiredSnapshot={wallet?.expired_balance_snapshot}
            missedDeadlineAt={wallet?.missed_deadline_at}
            balanceExpiredAt={wallet?.balance_expired_at}
          />
        )}

        <div>
          <p className="text-sm font-semibold mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { to: "/deposit", icon: ArrowDownToLine, label: "Deposit" },
              { to: "/withdraw", icon: ArrowUpFromLine, label: "Withdraw" },
              { to: "/games", icon: Gamepad2, label: "Games" },
              { to: "/offers", icon: Tag, label: "Offers" },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-primary transition">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-center">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
