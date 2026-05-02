import { Link } from "@tanstack/react-router";
import { offerImageSrc, type OfferSlotDef } from "@/lib/offer-config";

type Props = {
  slot: OfferSlotDef;
  /** Shown as "{bonusLabel} Bonus" — comes from DB / admin */
  bonusLabel: string;
  compact?: boolean;
};

export function OfferSlideCard({ slot, bonusLabel, compact }: Props) {
  const bonusText = `${bonusLabel.trim()} Bonus`;

  const buttonClass = compact
    ? "block w-full text-center rounded-xl bg-gradient-primary font-semibold shadow-glow hover:opacity-95 transition py-2.5 text-xs px-2"
    : "block w-full text-center rounded-xl bg-gradient-primary font-semibold shadow-glow hover:opacity-95 transition py-3.5 text-sm";

  const overlay = (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-end px-3 pb-3 pt-14 sm:pt-16 bg-gradient-to-t from-black/92 via-black/50 to-transparent">
      <p
        className={`inline-flex flex-wrap items-center justify-end gap-x-1 gap-y-0 font-extrabold text-white tracking-tight drop-shadow-lg leading-tight text-right ${compact ? "text-sm" : "text-base sm:text-xl"}`}
      >
        <span>{bonusText}</span>
        <span className={`select-none shrink-0 ${compact ? "text-xl" : "text-2xl sm:text-3xl"} leading-none`} aria-hidden>
          🔥
        </span>
      </p>
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-card">
      {compact ? (
        <div className="relative w-full bg-muted aspect-[16/10]">
          <img
            src={offerImageSrc(slot.imageFile)}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover"
            loading="lazy"
          />
          {overlay}
        </div>
      ) : (
        <div
          className="relative flex w-full items-center justify-center bg-muted aspect-[16/9] px-3 py-3 sm:aspect-[16/10] sm:px-4 sm:py-4"
        >
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
