import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOfferCountdowns(userId: string | null | undefined): Record<string, string> {
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userId) { setCountdowns({}); return; }
    void supabase
      .from("offer_countdowns")
      .select("offer_id, expires_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data ?? []).forEach((r: { offer_id: string; expires_at: string }) => {
          map[r.offer_id] = r.expires_at;
        });
        setCountdowns(map);
      });
  }, [userId]);

  return countdowns;
}
