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

async function computeDepositDeadlineFallback(userId: string, walletRow: Wallet | null): Promise<string | null> {
  if (isoDeadlineStillAhead(walletRow?.balance_deadline_at ?? null)) return null;

  let hours = 10;
  try {
    const { data } = await supabase.from("balance_deadline_settings").select("deadline_hours").eq("id", 1).maybeSingle();
    const h = Number(data?.deadline_hours);
    if (Number.isFinite(h) && h > 0) hours = h;
  } catch {
    /* default hours */
  }

  let createdAt: string | null = null;
  try {
    const { data } = await supabase
      .from("deposits")
      .select("created_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    createdAt = data?.created_at ?? null;
  } catch {
    return null;
  }

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

  /**
   * Deposit countdown: prefer DB rolling deadline whenever it is still in the future (set on pending submit).
   * If DB deadline missing but user still has pending deposits, use created_at + admin hours fallback.
   */
  const depositDeadlineAt = useMemo(() => {
    const db = wallet?.balance_deadline_at ?? null;
    if (isoDeadlineStillAhead(db)) return db;
    if (!hasPendingDeposit) return null;
    const fb = fallbackDeadlineAt ?? null;
    return isoDeadlineStillAhead(fb) ? fb : null;
  }, [hasPendingDeposit, wallet?.balance_deadline_at, fallbackDeadlineAt]);

  const refreshWallet = useCallback(async () => {
    if (!userId) return;
    await supabase.rpc("wallet_apply_balance_expiry").catch(() => {});

    const [walletRes, pendingRes] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("deposits").select("id").eq("user_id", userId).eq("status", "pending").limit(1),
    ]);

    const row = coerceWalletNumeric(walletRes.data as Wallet | null);
    const pending = !pendingRes.error && (pendingRes.data?.length ?? 0) > 0;

    setWallet(row);
    setHasPendingDeposit(pending);
    setLoading(false);

    const fb = pending ? await computeDepositDeadlineFallback(userId, row) : null;
    setFallbackDeadlineAt(fb);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setWallet(null);
      setFallbackDeadlineAt(null);
      setHasPendingDeposit(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      await refreshWallet();
      if (cancelled) return;
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
