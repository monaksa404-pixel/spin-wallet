import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader, StepIndicator } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/deposit/gift-card")({
  head: () => ({ meta: [{ title: "Gift Card Deposit — GameBonus" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    brand: typeof search.brand === "string" ? search.brand : undefined,
  }),
  component: GiftCardDeposit,
});

/** Files in `public/images/` — order puts common picks first; scroll for the rest */
type GiftCardOption = { id: string; displayName: string; file: string };

const GIFT_CARDS: GiftCardOption[] = [
  { id: "razer_gold", displayName: "Razer Gold", file: "razer_recent.png" },
  { id: "itunes", displayName: "iTunes", file: "itunes.png" },
  { id: "stc_pay", displayName: "STC Pay", file: "stc.png" },
  { id: "mobily", displayName: "Mobily", file: "mobily.png" },
  { id: "lebara", displayName: "LEBARA", file: "lebara_brand.png" },
  { id: "google_play", displayName: "Google Play", file: "google_play_brand_v2.png" },
  { id: "netflix", displayName: "Netflix", file: "netflix_brand.png" },
  { id: "playstation", displayName: "PlayStation", file: "playstation.png" },
  { id: "steam", displayName: "Steam", file: "steam.png" },
  { id: "xbox", displayName: "Xbox", file: "xbox.png" },
  { id: "nintendo", displayName: "Nintendo", file: "nintendo.png" },
  { id: "gamestop", displayName: "GameStop", file: "game_stop.png" },
  { id: "roblox", displayName: "Roblox", file: "roblox.png" },
  { id: "pubg", displayName: "PUBG", file: "pubg.png" },
  { id: "free_fire", displayName: "Free Fire", file: "freefire.png" },
  { id: "riot", displayName: "Riot Games", file: "riot_games.png" },
  { id: "du", displayName: "du", file: "du.png" },
  { id: "friendi", displayName: "Friendi", file: "friendi.png" },
  { id: "omantel", displayName: "Omantel", file: "omantel brand.png" },
];

function publicImageSrc(file: string): string {
  return `/images/${encodeURIComponent(file)}`;
}

function GiftCardDeposit() {
  const { brand: brandFromUrl } = Route.useSearch();
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!brandFromUrl) return;
    if (GIFT_CARDS.some((c) => c.id === brandFromUrl)) setSelected(brandFromUrl);
  }, [brandFromUrl]);

  const submit = async () => {
    if (!selected || !code.trim()) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Please log in");
      navigate({ to: "/login" });
      setBusy(false);
      return;
    }
    const card = GIFT_CARDS.find((c) => c.id === selected);
    const brandLabel = card?.displayName ?? selected;
    const { error } = await supabase.from("deposits").insert({
      user_id: u.user.id,
      method: "gift_card",
      gift_card_brand: brandLabel,
      gift_card_code: code.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Submitted! Pending admin review.");
    navigate({ to: "/deposit/pending" });
  };

  const selectedCard = selected ? GIFT_CARDS.find((c) => c.id === selected) : null;

  return (
    <MobileShell>
      <PageHeader title="Gift Card Deposit" back="/deposit" />
      <StepIndicator step={1} />
      <div className="px-4 space-y-5 pb-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-muted-foreground">Select Gift Card</p>
            <p className="text-[10px] text-muted-foreground whitespace-nowrap">Swipe → more</p>
          </div>

          <div
            className="flex gap-2.5 overflow-x-auto pb-4 pt-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
            role="listbox"
            aria-label="Gift card brands"
          >
            {GIFT_CARDS.map((c) => {
              const active = selected === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelected(c.id)}
                  className={`snap-start shrink-0 w-[4.6rem] sm:w-[4.85rem] rounded-xl border-2 bg-card overflow-hidden transition shadow-card flex flex-col ${active ? "border-primary-glow shadow-glow ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
                >
                  <div className="relative aspect-square w-full shrink-0 bg-muted/40 rounded-t-xl overflow-hidden">
                    <div className="absolute inset-0 z-0 flex items-start justify-start p-1.5 pr-10 pt-1">
                      <img
                        src={publicImageSrc(c.file)}
                        alt=""
                        className="max-h-[88%] max-w-[88%] object-contain object-left-top relative z-0"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    {/* Emoji renders reliably across browsers; sits above logo art */}
                    <span
                      className="absolute top-0 right-0 z-[100] flex h-9 min-w-[2.25rem] items-center justify-center rounded-bl-lg bg-gradient-to-br from-orange-500 to-red-600 px-1 text-[20px] leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5)] pointer-events-none select-none"
                      title="Popular"
                      aria-hidden
                    >
                      🔥
                    </span>
                  </div>
                  <p className="text-[9px] font-semibold text-center leading-tight px-1 py-1.5 line-clamp-2 text-foreground">
                    {c.displayName}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedCard && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="text-primary-glow font-semibold">{selectedCard.displayName}</span>
            </p>
          )}
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Enter Gift Card Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter gift card code"
            className="mt-2 w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
          />
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3 flex gap-2 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
          <p>
            Admin receives your <strong className="text-foreground">gift brand name</strong> and{" "}
            <strong className="text-foreground">code</strong> to verify manually before crediting your balance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!selected || !code.trim() || busy}
          className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow disabled:opacity-50 disabled:shadow-none"
        >
          {busy ? "Submitting..." : "Submit"}
        </button>
      </div>
    </MobileShell>
  );
}
