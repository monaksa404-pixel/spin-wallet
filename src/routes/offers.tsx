import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";
import { OfferSlideCard } from "@/components/OfferSlideCard";
import { useAuth } from "@/hooks/useAuth";
import { useOfferPromotions } from "@/hooks/useOfferPromotions";
import { useOfferCountdowns } from "@/hooks/useOfferCountdowns";
import { OFFER_SLOTS_ORDERED } from "@/lib/offer-config";

export const Route = createFileRoute("/offers")({
  head: () => ({ meta: [{ title: "Offers & Deals — GameBonus" }] }),
  component: OffersPage,
});

function OffersPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { bonusFor } = useOfferPromotions();
  const countdowns = useOfferCountdowns(user?.id);
  const [tab, setTab] = useState<"active" | "past">("active");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  return (
    <MobileShell>
      <PageHeader title="Offers & Deals" />
      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-xl p-1 grid grid-cols-2 gap-1">
          {(["active", "past"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-2 rounded-lg text-sm font-semibold capitalize transition ${tab === t ? "bg-gradient-primary shadow-glow" : "text-muted-foreground"}`}
            >
              {t} Offers
            </button>
          ))}
        </div>

        {tab === "active" ? (
          <div className="space-y-5">
            {OFFER_SLOTS_ORDERED.map((slot) => (
              <OfferSlideCard key={slot.id} slot={slot} bonusLabel={bonusFor(slot.id)} countdownAt={countdowns[slot.id]} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No archived offers yet.
          </div>
        )}
      </div>
    </MobileShell>
  );
}
