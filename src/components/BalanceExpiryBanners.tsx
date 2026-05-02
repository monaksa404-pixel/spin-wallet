import { AlarmClock, Info, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

function formatClock(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function BalanceExpiryTopBanner(props: {
  expiredSnapshot: number | null | undefined;
  missedDeadlineAt: string | null | undefined;
  balanceExpiredAt: string | null | undefined;
}) {
  const { expiredSnapshot, missedDeadlineAt, balanceExpiredAt } = props;
  const [howOpen, setHowOpen] = useState(false);
  if (!expiredSnapshot || expiredSnapshot <= 0) return null;

  const cutoff = missedDeadlineAt ?? balanceExpiredAt;
  const amt = `$${Number(expiredSnapshot).toFixed(2)}`;

  return (
    <>
      <div className="rounded-xl border-2 border-red-600 bg-red-950/90 px-3 py-3 shadow-lg">
        <div className="flex items-stretch gap-2">
          <div className="flex items-center justify-center shrink-0 w-11 rounded-lg bg-red-900/80 border border-red-500/50">
            <AlarmClock className="w-6 h-6 text-red-400" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-400 font-extrabold text-sm tracking-wide">Balance expired</p>
            <p className="text-xs text-white/90 mt-1 leading-snug">
              No deposit was approved before{" "}
              <span className="text-red-400 font-semibold">{formatClock(cutoff)}</span>. Your{" "}
              <span className="text-red-400 font-semibold">{amt}</span> in-app balance expired and is no longer
              available.
            </p>
            <p className="text-[10px] text-red-300/95 mt-1.5 font-medium">
              {formatClock(cutoff)} · {formatDate(cutoff)}
            </p>
          </div>
          <div className="hidden sm:flex flex-col justify-center items-end shrink-0 border-l border-dashed border-red-600/70 pl-3">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Expired at</p>
            <p className="text-lg font-black text-red-400 leading-none">{formatClock(cutoff)}</p>
            <p className="text-[10px] text-white/70 mt-0.5">{formatDate(cutoff)}</p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-red-700/35 flex justify-end">
          <button
            type="button"
            onClick={() => setHowOpen(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-red-900/55 hover:bg-red-900 border border-red-500/45 rounded-lg px-2.5 py-1.5"
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            How it works
          </button>
        </div>
      </div>
      {howOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          aria-label="Close"
          onClick={() => setHowOpen(false)}
        />
      )}
      {howOpen && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[min(92vw,22rem)] rounded-2xl border border-border bg-card p-5 shadow-2xl">
          <p className="font-bold text-lg">How the deposit window works</p>
          <ul className="mt-3 text-sm text-muted-foreground space-y-2 list-disc pl-4">
            <li>When you submit a deposit request, a countdown starts based on the hours set by admin (default 10h).</li>
            <li>If an admin approves your deposit before the deadline, your balance is safe and timers clear.</li>
            <li>If the time runs out without an approved deposit, your in-app balance can be expired per policy.</li>
          </ul>
          <button
            type="button"
            className="mt-4 w-full py-3 rounded-xl bg-gradient-primary font-semibold text-sm shadow-glow"
            onClick={() => setHowOpen(false)}
          >
            OK
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Sticky navbar-style countdown bar — pinned just below the top header so it's always
 * visible while scrolling.  Parent must render this OUTSIDE the scrollable content div
 * (directly inside MobileShell, after the <header>).
 */
export function DepositDeadlineBanner(props: { deadlineAt: string | null | undefined }) {
  const { deadlineAt } = props;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!deadlineAt) return;
    const endMs = new Date(deadlineAt).getTime();
    if (Number.isNaN(endMs) || endMs <= Date.now()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [deadlineAt]);

  if (!deadlineAt) return null;
  const endMs = new Date(deadlineAt).getTime();
  if (Number.isNaN(endMs) || endMs <= Date.now()) return null;

  const msLeft = Math.max(0, endMs - Date.now());
  const pad = (n: number) => String(n).padStart(2, "0");
  const hh = Math.floor(msLeft / 3_600_000);
  const mm = Math.floor((msLeft % 3_600_000) / 60_000);
  const ss = Math.floor((msLeft % 60_000) / 1000);
  const countdownLabel = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;

  const end = new Date(deadlineAt);
  const timeLabel = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="sticky top-0 z-40 w-full bg-amber-500 shadow-[0_2px_12px_rgba(245,158,11,0.45)]">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <AlarmClock className="w-4 h-4 shrink-0 text-amber-950" strokeWidth={2.5} />
          <span className="text-amber-950 text-xs font-bold truncate">
            Approve before <span className="font-black">{timeLabel}</span>
            <span className="hidden sm:inline font-normal opacity-75"> or balance may expire</span>
          </span>
        </div>
        <span className="font-mono font-black text-amber-950 text-sm tabular-nums shrink-0 bg-amber-950/15 rounded-md px-2 py-0.5 tracking-wider">
          {countdownLabel}
        </span>
      </div>
    </div>
  );
}

export function MinWithdrawFooter() {
  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/25 text-[11px] text-primary/90">
      <Shield className="w-4 h-4 shrink-0 text-primary-glow" />
      <span>Minimum withdrawal amount is 1000 USDT</span>
    </div>
  );
}

export function WithdrawQuickLink({ disabled }: { disabled: boolean }) {
  if (disabled) {
    return (
      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted text-muted-foreground cursor-not-allowed border border-border">
        Withdraw
      </span>
    );
  }
  return (
    <Link to="/withdraw" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary transition">
      Withdraw
    </Link>
  );
}
