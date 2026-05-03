import { useEffect, useState } from "react";
import { useOfferPromotions } from "@/hooks/useOfferPromotions";
import { useOfferCountdowns } from "@/hooks/useOfferCountdowns";
import { OFFER_SLOTS_ORDERED } from "@/lib/offer-config";
import { OfferSlideCard } from "@/components/OfferSlideCard";
import { useAuth } from "@/hooks/useAuth";

const ROTATE_MS = 4500;

export function HomeOffersCarousel() {
  const { user } = useAuth();
  const { bonusFor } = useOfferPromotions();
  const countdowns = useOfferCountdowns(user?.id);
  const [index, setIndex] = useState(0);
  const slides = OFFER_SLOTS_ORDERED;

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <div className="rounded-2xl overflow-hidden border border-primary/30 shadow-glow bg-card">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slot) => (
            <div key={slot.id} className="min-w-full shrink-0 box-border px-1 pt-1 pb-0.5">
              <OfferSlideCard slot={slot} bonusLabel={bonusFor(slot.id)} compact countdownAt={countdowns[slot.id]} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 py-2.5 bg-card border-t border-border/60">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Show offer ${idx + 1}`}
            aria-current={idx === index}
            onClick={() => setIndex(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === index ? "w-7 bg-primary-glow shadow-glow" : "w-1.5 bg-muted-foreground/35 hover:bg-muted-foreground/55"}`}
          />
        ))}
      </div>
    </div>
  );
}
