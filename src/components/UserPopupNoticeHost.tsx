import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Source = "withdrawal" | "deposit";

type Notice = {
  source: Source;
  id: string;
  outcome: "success" | "failed" | "pending";
  title: string;
  body: string;
  failure_reason: string | null;
};

type NoticeRow = {
  id: string;
  outcome: string;
  title: string;
  body: string;
  failure_reason: string | null;
  created_at: string;
};

function pickNext(w: NoticeRow | null, d: NoticeRow | null): Notice | null {
  if (!w && !d) return null;
  if (!w) return { source: "deposit", ...mapRow(d!) };
  if (!d) return { source: "withdrawal", ...mapRow(w) };
  const tw = new Date(w.created_at).getTime();
  const td = new Date(d.created_at).getTime();
  if (tw <= td) return { source: "withdrawal", ...mapRow(w) };
  return { source: "deposit", ...mapRow(d) };
}

function mapRow(r: NoticeRow): Omit<Notice, "source"> {
  return {
    id: r.id,
    outcome: r.outcome as Notice["outcome"],
    title: r.title,
    body: r.body,
    failure_reason: r.failure_reason,
  };
}

export function UserPopupNoticeHost() {
  const { user, loading } = useAuth();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const loadNext = useCallback(async () => {
    if (!user?.id) {
      setNotice(null);
      return;
    }
    const [wRes, dRes] = await Promise.all([
      supabase
        .from("withdrawal_popup_notices")
        .select("id, outcome, title, body, failure_reason, created_at")
        .eq("user_id", user.id)
        .is("dismissed_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("deposit_popup_notices")
        .select("id, outcome, title, body, failure_reason, created_at")
        .eq("user_id", user.id)
        .is("dismissed_at", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);
    if (wRes.error || dRes.error) {
      setNotice(null);
      return;
    }
    setNotice(pickNext((wRes.data as NoticeRow | null) ?? null, (dRes.data as NoticeRow | null) ?? null));
    setExiting(false);
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading || !user?.id) return;
    void loadNext();
  }, [loading, user?.id, loadNext]);

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`popup-notices:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "withdrawal_popup_notices", filter: `user_id=eq.${user.id}` },
        () => void loadNext(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "withdrawal_popup_notices", filter: `user_id=eq.${user.id}` },
        () => void loadNext(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deposit_popup_notices", filter: `user_id=eq.${user.id}` },
        () => void loadNext(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deposit_popup_notices", filter: `user_id=eq.${user.id}` },
        () => void loadNext(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, loadNext]);

  const dismiss = async () => {
    if (!notice?.id || dismissing) return;
    setDismissing(true);
    const { error } =
      notice.source === "withdrawal"
        ? await supabase.rpc("dismiss_withdrawal_popup", { _notice_id: notice.id })
        : await supabase.rpc("dismiss_deposit_popup", { _notice_id: notice.id });
    if (error) {
      toast.error(error.message);
      setDismissing(false);
      return;
    }
    setExiting(true);
    await new Promise((r) => setTimeout(r, 240));
    setDismissing(false);
    setNotice(null);
    setExiting(false);
    void loadNext();
  };

  if (!mounted || !notice) return null;

  const isSuccess = notice.outcome === "success";
  const isFailed = notice.outcome === "failed";
  const isPending = notice.outcome === "pending";

  const shell =
    isSuccess
      ? "border-emerald-500/45 shadow-[0_0_48px_rgba(16,185,129,0.22)] bg-gradient-to-br from-emerald-950/95 via-background/92 to-background/95"
      : isFailed
        ? "border-red-500/45 shadow-[0_0_48px_rgba(239,68,68,0.22)] bg-gradient-to-br from-red-950/95 via-background/92 to-background/95"
        : "border-amber-500/45 shadow-[0_0_48px_rgba(245,158,11,0.2)] bg-gradient-to-br from-amber-950/90 via-background/92 to-background/95";

  const iconWrap =
    isSuccess
      ? "bg-emerald-500/15 border border-emerald-400/40 text-emerald-300"
      : isFailed
        ? "bg-red-500/15 border border-red-400/40 text-red-300"
        : "bg-amber-500/15 border border-amber-400/40 text-amber-300";

  const Icon = isSuccess ? CheckCircle2 : isFailed ? XCircle : Clock;

  const node = (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${exiting ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upn-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        aria-label="Dismiss overlay"
        onClick={() => void dismiss()}
      />
      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 ease-out ${shell} ${exiting ? "scale-95 translate-y-2 opacity-0" : "scale-100 translate-y-0 opacity-100"}`}
      >
        <button
          type="button"
          onClick={() => void dismiss()}
          disabled={dismissing}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${iconWrap}`}>
            <Icon className={`h-9 w-9 ${isSuccess ? "animate-[pulse_2s_ease-in-out_infinite]" : ""}`} strokeWidth={1.75} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
            {notice.source === "deposit" ? "Deposit" : "Withdrawal"}
          </p>
          <h2 id="upn-title" className="text-xl font-black tracking-tight text-foreground">
            {notice.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{notice.body}</p>
          {isFailed && notice.failure_reason && (
            <div className="mt-4 w-full rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-300/90">Reason</p>
              <p className="mt-1 text-sm font-medium text-red-100">{notice.failure_reason}</p>
            </div>
          )}
          <button
            type="button"
            disabled={dismissing}
            onClick={() => void dismiss()}
            className={`mt-6 w-full rounded-xl py-3.5 text-sm font-bold transition ${
              isSuccess
                ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                : isFailed
                  ? "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
                  : "bg-amber-600 text-white hover:bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            } disabled:opacity-60`}
          >
            {dismissing ? "Closing…" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
