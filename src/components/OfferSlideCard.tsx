import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { offerImageSrc, type OfferSlotDef } from "@/lib/offer-config";

type Props = {
  slot: OfferSlotDef;
  bonusLabel: string;
  compact?: boolean;
  countdownAt?: string | null;
};

function useCountdown(expiresAt: string | null | undefined) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  if (ms <= 0) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hrs  = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return { days: pad(days), hrs: pad(hrs), mins: pad(mins), secs: pad(secs) };
}

function TimeBox({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-black/70 border border-white/20 rounded-md px-1.5 py-0.5 font-mono font-black text-white text-sm leading-none min-w-[26px] text-center">
        {val}
      </span>
      <span className="text-[8px] text-white/55 mt-0.5 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export function OfferSlideCard({ slot, bonusLabel, compact, countdownAt }: Props) {
  const bonusText = `${bonusLabel.trim()} Bonus`;
  const timer = useCountdown(countdownAt);

  const buttonClass = compact
    ? "block w-full text-center rounded-xl bg-gradient-primary font-semibold shadow-glow hover:opacity-95 transition py-2.5 text-xs px-2"
    : "block w-full text-center rounded-xl bg-gradient-primary font-semibold shadow-glow hover:opacity-95 transition py-3.5 text-sm";

  const overlay = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between px-3 pb-3 pt-14 sm:pt-16 bg-gradient-to-t from-black/92 via-black/50 to-transparent">
      <p
        className={`inline-flex flex-wrap items-center gap-x-1 gap-y-0 font-extrabold text-white tracking-tight drop-shadow-lg leading-tight ${compact ? "text-sm" : "text-base sm:text-xl"}`}
      >
        <span>{bonusText}</span>
        <span className={`select-none shrink-0 ${compact ? "text-xl" : "text-2xl sm:text-3xl"} leading-none`} aria-hidden>
          🔥
        </span>
      </p>
      {timer && (
        <div className="flex items-end gap-1 shrink-0">
          <TimeBox val={timer.days} label="Days" />
          <span className="text-white/70 font-bold text-xs mb-3">:</span>
          <TimeBox val={timer.hrs}  label="Hrs"  />
          <span className="text-white/70 font-bold text-xs mb-3">:</span>
          <TimeBox val={timer.mins} label="Mins" />
          <span className="text-white/70 font-bold text-xs mb-3">:</span>
          <TimeBox val={timer.secs} label="Secs" />
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-card">
      {compact ? (
        <div className="relative w-full bg-muted aspect-[16/8]">
          <img
            src={offerImageSrc(slot.imageFile)}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover"
            loading="lazy"
          />
          {overlay}
        </div>
      ) : (
        <div className="relative flex w-full items-center justify-center bg-muted aspect-[16/9] px-3 py-3 sm:aspect-[16/10] sm:px-4 sm:py-4">
          <img
            src={offerImageSrc(slot.imageFile)}
            alt=""
            className="relative z-0 h-auto w-auto max-h-full max-w-full object-contain object-center"
            loading="lazy"
          />
          {overlay}
        </div>
      )}
      <div className={compact ? "p-2" : "p-3"}>
        {slot.giftBrandId ? (
          <Link to="/deposit/gift-card" search={{ brand: slot.giftBrandId }} className={buttonClass}>
            {slot.depositButtonLabel}
          </Link>
        ) : (
          <Link to="/deposit/bank" className={buttonClass}>
            {slot.depositButtonLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
