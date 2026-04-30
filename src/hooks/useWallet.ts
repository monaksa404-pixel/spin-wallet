import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Wallet = {
  user_id: string;
  balance: number;
  bonus_balance: number;
  pending_balance: number;
};

export function useWallet(userId: string | null | undefined) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) {
        setWallet(data as Wallet | null);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`wallet:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        (payload) => setWallet(payload.new as Wallet),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { wallet, loading };
}
