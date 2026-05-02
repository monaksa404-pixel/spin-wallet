import { useEffect, useState } from "react";
import type { OfferSlotId } from "@/lib/offer-config";
import { supabase } from "@/integrations/supabase/client";

export function useOfferPromotions() {
  const [bonusById, setBonusById] = useState<Record<OfferSlotId, string>>({
    offer1: "5X",
    offer2: "5X",
    offer3: "5X",
    offer4: "5X",
    offer5: "5X",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.from("offer_promotions").select("id, bonus_label");
      if (cancelled) return;
      if (error || !data?.length) {
        setLoading(false);
        return;
      }
      setBonusById((prev) => {
        const next = { ...prev };
        for (const row of data as { id: OfferSlotId; bonus_label: string }[]) {
          if (row.id && row.bonus_label) next[row.id] = row.bonus_label.trim() || prev[row.id];
        }
        return next;
      });
      setLoading(false);
    })();
    const ch = supabase
      .channel("offer_promotions_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "offer_promotions" }, () => {
        void supabase.from("offer_promotions").select("id, bonus_label").then(({ data: rows }) => {
          if (!rows?.length || cancelled) return;
          setBonusById((prev) => {
            const next = { ...prev };
            for (const row of rows as { id: OfferSlotId; bonus_label: string }[]) {
              if (row.id && row.bonus_label) next[row.id] = row.bonus_label.trim() || prev[row.id];
            }
            return next;
          });
        });
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  const bonusFor = (id: OfferSlotId) => bonusById[id] ?? "5X";

  return { bonusFor, bonusById, loading };
}
