import { AlarmClock, FileX, Info, Shield, X } from "lucide-react";
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
  const timeLabel = formatClock(cutoff);
  const dateLabel = formatDate(cutoff);

  return (
    <div className="rounded-xl border-2 border-red-700/80 bg-[#1c0505] px-3 py-3 shadow-lg">
      <div className="flex items-stretch gap-3">
        <div className="relative flex items-center justify-center shrink-0">
          <div className="w-12 h-12 rounded-full bg-red-900/60 border-2 border-red-600 flex items-center justify-center">
            <AlarmClock className="w-6 h-6 text-red-400" strokeWidth={2} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 border-2 border-[#1c0505] flex items-center justify-center">
            <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-orange-400 font-extrabold text-base tracking-wide leading-tight">TIME EXPIRED!</p>
          <p className="text-xs text-white/80 mt-0.5 leading-snug">
            You didn't deposit before{" "}
            <span className="font-semibold text-white">{timeLabel}</span>.{" "}
            Your balance has <span className="text-red-400 font-semibold">expired</span>.
          </p>
        </div>
        <div className="flex flex-col justify-center items-end shrink-0 border-l-2 border-dashed border-red-700/60 pl-3 min-w-[72px]">
          <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Expired at</p>
          <p className="text-lg font-black text-red-400 leading-tight tabular-nums">{timeLabel}</p>
          <p className="text-[9px] text-white/45 mt-0.5 text-right leading-tight">{dateLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function BalanceExpiredBottomBar(props: {
  expiredSnapshot: number | null | undefined;
  missedDeadlineAt: string | null | undefined;
  balanceExpiredAt: string | null | undefined;
}) {
  const { expiredSnapshot, missedDeadlineAt, balanceExpiredAt } = props;
  const [howOpen, setHowOpen] = useState(false);
  if (!expiredSnapshot || expiredSnapshot <= 0) return null;

  const cutoff = missedDeadlineAt ?? balanceExpiredAt;
  const timeLabel = formatClock(cutoff);
  const amt = `$${Number(expiredSnapshot).toFixed(2)}`;

  return (
    <>
      <div className="rounded-xl border border-red-700/60 bg-red-950/40 px-3 py-3 flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-red-900/50 border border-red-600/50">
          <FileX className="w-5 h-5 text-red-400" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-400 font-extrabold text-xs tracking-wider uppercase">Balance Expired</p>
          <p className="text-xs text-white/70 mt-0.5 leading-snug">
            You didn't deposit before <span className="font-semibold text-white">{timeLabel}</span>.{" "}
            Your <span className="text-red-400 font-semibold">{amt}</span> balance has expired.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHowOpen(true)}
          className="shrink-0 flex items-center gap-1 text-[11px] text-white/70 border border-white/15 rounded-lg px-2 py-1.5 hover:bg-white/5 whitespace-nowrap"
        >
          <Info className="w-3 h-3" />
          How it works?
        </button>
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
            <li>Admin sets a deadline for your account. A countdown shows at the top of the app.</li>
            <li>Deposit before the deadline and have an admin approve it — your balance is safe.</li>
            <li>If the time runs out without an approved deposit, your in-app balance expires.</li>
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
  const timeLabel = new Date(deadlineAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div className="sticky top-0 z-40 w-full border-b-2 border-amber-600/60 bg-amber-950/95 backdrop-blur shadow-[0_2px_12px_rgba(245,158,11,0.3)]">
      <div className="max-w-md mx-auto flex items-stretch gap-3 px-3 py-2.5">
        <div className="flex items-center justify-center shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-900/60 border-2 border-amber-500 flex items-center justify-center">
            <AlarmClock className="w-5 h-5 text-amber-300" strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-amber-300 font-extrabold text-xs tracking-wide uppercase leading-tight">Deposit Window</p>
          <p className="text-[11px] text-amber-100/70 leading-snug">
            Deposit before <span className="font-semibold text-amber-200">{timeLabel}</span> or balance may expire.
          </p>
        </div>
        <div className="flex flex-col justify-center items-end shrink-0 border-l-2 border-dashed border-amber-700/60 pl-3">
          <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Expires in</p>
          <p className="font-mono font-black text-amber-300 text-base tabular-nums leading-tight tracking-wider">
            {countdownLabel}
          </p>
        </div>
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
