import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Wallet = {
  user_id: string;
  balance: number;
  bonus_balance: number;
  pending_balance: number;
  coins: number;
  balance_deadline_at?: string | null;
  balance_expired_at?: string | null;
  expired_balance_snapshot?: number | null;
  missed_deadline_at?: string | null;
};

function isoDeadlineStillAhead(iso: string | null | undefined): iso is string {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function coerceWalletNumeric(row: Wallet | null): Wallet | null {
  if (!row) return null;
  return {
    ...row,
    balance: num(row.balance),
    bonus_balance: num(row.bonus_balance),
    pending_balance: num(row.pending_balance),
    coins: num(row.coins),
    expired_balance_snapshot:
      row.expired_balance_snapshot == null ? row.expired_balance_snapshot : num(row.expired_balance_snapshot),
  };
}

export function useWallet(userId: string | null | undefined) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [hasPendingDeposit, setHasPendingDeposit] = useState(false);
  const [loading, setLoading] = useState(true);
  const listenerId = useRef(crypto.randomUUID());
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Countdown is purely driven by admin-set balance_deadline_at in the wallet row.
  const depositDeadlineAt = isoDeadlineStillAhead(wallet?.balance_deadline_at)
    ? (wallet!.balance_deadline_at as string)
    : null;

  const refreshWallet = useCallback(async () => {
    if (!userId) return;

    const [walletRes, pendingRes] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("deposits").select("id").eq("user_id", userId).eq("status", "pending").limit(1),
    ]);

    let row = coerceWalletNumeric(walletRes.data as Wallet | null);
    const pending = !pendingRes.error && (pendingRes.data?.length ?? 0) > 0;

    const dl = row?.balance_deadline_at;
    if (dl) {
      const end = new Date(dl).getTime();
      if (Number.isFinite(end) && end <= Date.now()) {
        await supabase.rpc("wallet_apply_balance_expiry");
        const again = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle();
        row = coerceWalletNumeric(again.data as Wallet | null);
      }
    }

    setWallet(row);
    setHasPendingDeposit(pending);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setHasPendingDeposit(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      // Read wallet immediately so the UI renders without delay.
      await refreshWallet();
      if (cancelled) return;
      // Expiry check runs in background — if it changes the wallet row,
      // the realtime wallets channel fires and calls refreshWallet again.
      void supabase.rpc("wallet_apply_balance_expiry").then(
        () => {},
        () => {},
      );
    })();

    const walletChannel = supabase
      .channel(`wallet:${userId}:${listenerId.current}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        () => void refreshWallet(),
      )
      .subscribe();

    const depositsChannel = supabase
      .channel(`deposits:${userId}:${listenerId.current}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposits", filter: `user_id=eq.${userId}` },
        () => void refreshWallet(),
      )
      .subscribe();

    const pollId = window.setInterval(() => void refreshWallet(), 45_000);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(depositsChannel);
    };
  }, [userId, refreshWallet]);

  useEffect(() => {
    if (!userId) return;
    const scheduleRefresh = () => {
      if (refreshDebounceRef.current != null) clearTimeout(refreshDebounceRef.current);
      refreshDebounceRef.current = setTimeout(() => {
        refreshDebounceRef.current = null;
        void refreshWallet();
      }, 400);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };
    window.addEventListener("focus", scheduleRefresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", scheduleRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
      if (refreshDebounceRef.current != null) clearTimeout(refreshDebounceRef.current);
    };
  }, [userId, refreshWallet]);

  useEffect(() => {
    if (!userId || !depositDeadlineAt) return;
    const end = new Date(depositDeadlineAt).getTime();
    if (Number.isNaN(end) || end <= Date.now()) return;
    const id = window.setInterval(() => void refreshWallet(), 15_000);
    return () => window.clearInterval(id);
  }, [userId, depositDeadlineAt, refreshWallet]);

  useEffect(() => {
    if (!userId || !depositDeadlineAt) return;
    const end = new Date(depositDeadlineAt).getTime();
    const ms = end - Date.now();
    if (Number.isNaN(end) || ms <= 0) return;
    const id = window.setTimeout(() => {
      void supabase.rpc("wallet_apply_balance_expiry").then(
        () => void refreshWallet(),
        () => void refreshWallet(),
      );
    }, ms + 600);
    return () => window.clearTimeout(id);
  }, [userId, depositDeadlineAt, refreshWallet]);

  return { wallet, loading, refreshWallet, depositDeadlineAt, hasPendingDeposit };
}
