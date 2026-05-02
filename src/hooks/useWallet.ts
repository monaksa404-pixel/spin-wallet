import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// Cache deadline_hours so we don't re-query on every refresh tick.
let cachedDeadlineHours: number | null = null;

async function computeDepositDeadlineFallback(userId: string, walletRow: Wallet | null): Promise<string | null> {
  if (isoDeadlineStillAhead(walletRow?.balance_deadline_at ?? null)) return null;

  // Fetch settings (cached) and latest pending deposit in parallel.
  const [settingsResult, depositResult] = await Promise.all([
    cachedDeadlineHours !== null
      ? Promise.resolve(cachedDeadlineHours)
      : supabase
          .from("balance_deadline_settings")
          .select("deadline_hours")
          .eq("id", 1)
          .maybeSingle()
          .then(({ data }) => {
            const h = Number(data?.deadline_hours);
            const hours = Number.isFinite(h) && h > 0 ? h : 10;
            cachedDeadlineHours = hours;
            return hours;
          })
          .catch(() => 10),
    supabase
      .from("deposits")
      .select("created_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const hours = typeof settingsResult === "number" ? settingsResult : 10;

  if (depositResult.error) return null;
  const row = Array.isArray(depositResult.data) ? depositResult.data[0] : null;
  const createdAt: string | null = row?.created_at ?? null;

  if (!createdAt) return null;
  const iso = new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000).toISOString();
  return isoDeadlineStillAhead(iso) ? iso : null;
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
  const [fallbackDeadlineAt, setFallbackDeadlineAt] = useState<string | null>(null);
  const [hasPendingDeposit, setHasPendingDeposit] = useState(false);
  const [loading, setLoading] = useState(true);
  const listenerId = useRef(crypto.randomUUID());
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track previous "needs fallback" state to avoid re-querying on every refresh tick.
  // Fallback is needed when: pending deposit exists AND no future DB deadline.
  const prevNeedsFallbackRef = useRef<boolean | null>(null);

  /**
   * Deposit countdown: prefer DB rolling deadline whenever it is still in the future (set on pending submit).
   * If DB deadline missing but user still has pending deposits, use created_at + admin hours fallback.
   */
  const depositDeadlineAt = useMemo(() => {
    // Show countdown whenever the wallet has a future deadline — regardless of
    // whether a deposit is already pending. The countdown means "deposit before
    // this time or your balance expires". It disappears only when admin approves
    // (which clears balance_deadline_at) or when the deadline passes.
    const db = wallet?.balance_deadline_at ?? null;
    if (isoDeadlineStillAhead(db)) return db;
    // Fallback: estimate from pending deposit created_at + admin deadline hours.
    const fb = fallbackDeadlineAt ?? null;
    return isoDeadlineStillAhead(fb) ? fb : null;
  }, [wallet?.balance_deadline_at, fallbackDeadlineAt]);

  /**
   * Lightweight read — just fetches wallet + pending-deposit flag.
   * Does NOT call wallet_apply_balance_expiry (which can zero balances).
   * The expiry check is only done once on initial mount.
   */
  const refreshWallet = useCallback(async () => {
    if (!userId) return;

    const [walletRes, pendingRes] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("deposits").select("id").eq("user_id", userId).eq("status", "pending").limit(1),
    ]);

    const row = coerceWalletNumeric(walletRes.data as Wallet | null);
    const pending = !pendingRes.error && (pendingRes.data?.length ?? 0) > 0;

    setWallet(row);
    setHasPendingDeposit(pending);
    setLoading(false);

    // Recompute fallback deadline when the need for it changes.
    // Fallback is needed only when there IS a pending deposit but NO future DB deadline
    // (e.g. the trigger hasn't run yet, or balance_deadline_at was cleared by expiry).
    // Skipping recompute when nothing changed avoids extra DB round-trips on every poll.
    const needsFallback = pending && !isoDeadlineStillAhead(row?.balance_deadline_at);
    if (prevNeedsFallbackRef.current !== needsFallback) {
      prevNeedsFallbackRef.current = needsFallback;
      if (needsFallback) {
        void computeDepositDeadlineFallback(userId, row).then(setFallbackDeadlineAt);
      } else {
        setFallbackDeadlineAt(null);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setFallbackDeadlineAt(null);
      setHasPendingDeposit(false);
      setLoading(false);
      prevNeedsFallbackRef.current = null;
      return;
    }
    let cancelled = false;
    void (async () => {
      // Read wallet immediately so the UI renders without delay.
      await refreshWallet();
      if (cancelled) return;
      // Expiry check runs in background — if it changes the wallet row,
      // the realtime wallets channel fires and calls refreshWallet again.
      void supabase.rpc("wallet_apply_balance_expiry").catch(() => {});
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

  return { wallet, loading, refreshWallet, depositDeadlineAt, hasPendingDeposit };
}
