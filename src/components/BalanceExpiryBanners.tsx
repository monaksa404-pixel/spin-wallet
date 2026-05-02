import { AlarmClock, FileX2, Info, Shield } from "lucide-react";
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
  if (!expiredSnapshot || expiredSnapshot <= 0) return null;

  const cutoff = missedDeadlineAt ?? balanceExpiredAt;

  return (
    <div className="rounded-xl border-2 border-red-600 bg-red-950/90 px-3 py-3 shadow-lg">
      <div className="flex items-stretch gap-2">
        <div className="flex items-center justify-center shrink-0 w-11 rounded-lg bg-red-900/80 border border-red-500/50">
          <AlarmClock className="w-6 h-6 text-red-400" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-400 font-extrabold text-sm tracking-wide">TIME EXPIRED!</p>
          <p className="text-xs text-white/90 mt-1 leading-snug">
            You didn&apos;t get a deposit approved before{" "}
            <span className="text-red-400 font-semibold">{formatClock(cutoff)}</span>. Your balance has{" "}
            <span className="text-red-400 font-semibold">expired</span>.
          </p>
          <p className="sm:hidden text-[10px] text-red-300/95 mt-1.5 font-medium">
            Expired at {formatClock(cutoff)} · {formatDate(cutoff)}
          </p>
        </div>
        <div className="hidden sm:flex flex-col justify-center items-end shrink-0 border-l border-dashed border-red-600/70 pl-3">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Expired at</p>
          <p className="text-lg font-black text-red-400 leading-none">{formatClock(cutoff)}</p>
          <p className="text-[10px] text-white/70 mt-0.5">{formatDate(cutoff)}</p>
        </div>
      </div>
    </div>
  );
}

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
  const hours = Math.floor(msLeft / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
  const seconds = Math.floor((msLeft % 60_000) / 1000);
  const countdownLabel = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const end = new Date(deadlineAt);
  const timeLabel = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const dateLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="rounded-xl border-2 border-amber-600/80 bg-amber-950/35 px-3 py-3">
      <div className="flex items-start gap-2">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
          <AlarmClock className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-amber-200 font-bold text-xs uppercase tracking-wide">Deposit window</p>
          <p className="text-sm text-white mt-1 leading-snug">
            Get a deposit <span className="font-semibold text-amber-300">approved by admin</span> before{" "}
            <span className="font-bold text-amber-200">{timeLabel}</span>{" "}
            <span className="text-white/70 text-xs">({dateLabel})</span> or your balance may expire.
          </p>
          <p className="mt-2 font-mono text-lg font-bold text-amber-300 tabular-nums">{countdownLabel}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0 border-l border-dashed border-amber-600/50 pl-2">
          <p className="text-[10px] font-bold text-amber-400 uppercase">Deadline</p>
          <p className="text-base font-black text-amber-200">{timeLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function BalanceExpiryBottomBar(props: {
  expiredSnapshot: number | null | undefined;
  missedDeadlineAt: string | null | undefined;
}) {
  const [howOpen, setHowOpen] = useState(false);
  const { expiredSnapshot, missedDeadlineAt } = props;
  if (!expiredSnapshot || expiredSnapshot <= 0) return null;

  const amt = `$${Number(expiredSnapshot).toFixed(2)}`;
  const clock = formatClock(missedDeadlineAt);

  return (
    <>
      <div className="fixed bottom-[4.25rem] left-1/2 -translate-x-1/2 w-full max-w-md z-[35] px-3 pointer-events-none">
        <div className="pointer-events-auto rounded-xl border-2 border-red-600 bg-red-950/95 backdrop-blur px-3 py-2.5 shadow-2xl flex items-stretch gap-2">
          <div className="flex items-center shrink-0">
            <FileX2 className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-400 font-extrabold text-xs uppercase tracking-wide">Balance expired</p>
            <p className="text-[11px] text-white/90 mt-0.5 leading-snug">
              No deposit was approved before <span className="text-red-400 font-semibold">{clock}</span>. Your {amt}{" "}
              balance expired.
            </p>
          </div>
          <div className="shrink-0 border-l border-dashed border-red-600/70 pl-2 flex flex-col justify-center">
            <button
              type="button"
              onClick={() => setHowOpen(true)}
              className="flex items-center gap-1 text-[10px] font-semibold text-white bg-red-900/60 hover:bg-red-900 border border-red-500/40 rounded-lg px-2 py-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              How it works
            </button>
          </div>
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
