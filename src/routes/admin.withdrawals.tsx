import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Bell } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/withdrawals")({
  head: () => ({ meta: [{ title: "Withdrawals — Admin" }] }),
  component: AdminWithdrawals,
});

type Status = "pending" | "approved" | "rejected";
type BaseRow = {
  id: string;
  user_id: string;
  method: string;
  amount: number;
  status: Status;
  created_at: string;
  usdt_address: string | null;
  account_name: string | null;
  account_number: string | null;
  iban: string | null;
  bank_name: string | null;
};
type ProfileRow = { id: string; full_name: string | null };
type Row = BaseRow & { profile_name: string };

type ModalKind = "approve" | "reject" | "pending" | null;

const DEF_APPROVE_TITLE = "Withdrawal approved";
const DEF_APPROVE_MSG =
  "Your withdrawal request was approved. Funds are being sent to your selected method.";
const DEF_REJECT_TITLE = "Withdrawal declined";
const DEF_REJECT_MSG = "Your withdrawal could not be completed.";
const DEF_PENDING_TITLE = "Withdrawal update";
const DEF_PENDING_MSG = "Your withdrawal is still being reviewed.";

function AdminWithdrawals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"All" | Status>("pending");
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeRow, setActiveRow] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [approveTitle, setApproveTitle] = useState(DEF_APPROVE_TITLE);
  const [approveMsg, setApproveMsg] = useState(DEF_APPROVE_MSG);
  const [rejectTitle, setRejectTitle] = useState(DEF_REJECT_TITLE);
  const [rejectMsg, setRejectMsg] = useState(DEF_REJECT_MSG);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingTitle, setPendingTitle] = useState(DEF_PENDING_TITLE);
  const [pendingMsg, setPendingMsg] = useState(DEF_PENDING_MSG);

  const openApprove = (r: Row) => {
    setActiveRow(r);
    setApproveTitle(DEF_APPROVE_TITLE);
    setApproveMsg(DEF_APPROVE_MSG);
    setModal("approve");
  };

  const openReject = (r: Row) => {
    setActiveRow(r);
    setRejectTitle(DEF_REJECT_TITLE);
    setRejectMsg(DEF_REJECT_MSG);
    setRejectReason("");
    setModal("reject");
  };

  const openPending = (r: Row) => {
    setActiveRow(r);
    setPendingTitle(DEF_PENDING_TITLE);
    setPendingMsg(DEF_PENDING_MSG);
    setModal("pending");
  };

  const closeModal = () => {
    setModal(null);
    setActiveRow(null);
  };

  const load = async () => {
    const { data, error } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }

    const baseRows = (data ?? []) as BaseRow[];
    const userIds = Array.from(new Set(baseRows.map((r) => r.user_id)));

    let profileMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p.full_name ?? "—"]));
    }

    setRows(baseRows.map((r) => ({ ...r, profile_name: profileMap.get(r.user_id) ?? "—" })));
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("admin-wd")
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => void load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const submitApprove = async () => {
    if (!activeRow) return;
    setSaving(true);
    const { error } = await supabase.rpc("approve_withdrawal", {
      _id: activeRow.id,
      _popup_title: approveTitle.trim() || null,
      _popup_message: approveMsg.trim() || null,
    } satisfies Database["public"]["Functions"]["approve_withdrawal"]["Args"]);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Withdrawal approved");
      closeModal();
      await load();
    }
  };

  const submitReject = async () => {
    if (!activeRow) return;
    if (!rejectReason.trim()) {
      toast.error("Enter a failure reason for the user");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("reject_withdrawal", {
      _id: activeRow.id,
      _popup_title: rejectTitle.trim(),
      _popup_message: rejectMsg.trim(),
      _failure_reason: rejectReason.trim(),
    } satisfies Database["public"]["Functions"]["reject_withdrawal"]["Args"]);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Rejected and refunded");
      closeModal();
      await load();
    }
  };

  const submitPending = async () => {
    if (!activeRow) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_withdrawal_pending_notice", {
      _withdrawal_id: activeRow.id,
      _popup_title: pendingTitle.trim(),
      _popup_message: pendingMsg.trim(),
    } satisfies Database["public"]["Functions"]["admin_withdrawal_pending_notice"]["Args"]);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Status update queued for user");
      closeModal();
      await load();
    }
  };

  const filtered = rows.filter((r) => tab === "All" || r.status === tab);

  return (
    <AdminShell title="Withdrawal Requests">
      <Dialog open={modal === "approve"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-md border-primary/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Approve withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Popup title (user)</label>
              <input
                value={approveTitle}
                onChange={(e) => setApproveTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Popup message (user)</label>
              <textarea
                value={approveMsg}
                onChange={(e) => setApproveMsg(e.target.value)}
                rows={4}
                className="mt-1 w-full resize-none rounded-lg border border-border bg-input px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" onClick={closeModal} className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void submitApprove()}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Approve & notify"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "reject"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-md border-destructive/25 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Reject withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Popup title (user)</label>
              <input
                value={rejectTitle}
                onChange={(e) => setRejectTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Popup message (user)</label>
              <textarea
                value={rejectMsg}
                onChange={(e) => setRejectMsg(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-border bg-input px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-destructive">Failure reason (popup + history)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="e.g. Bank account mismatch"
                className="mt-1 w-full resize-none rounded-lg border border-destructive/30 bg-input px-3 py-2 outline-none focus:border-destructive"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" onClick={closeModal} className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void submitReject()}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Reject & notify"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === "pending"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-md border-amber-500/25 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Pending status popup</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Sends a yellow &quot;pending&quot; popup only. Withdrawal stays pending.</p>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Popup title</label>
              <input
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Popup message</label>
              <textarea
                value={pendingMsg}
                onChange={(e) => setPendingMsg(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-border bg-input px-3 py-2 outline-none focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" onClick={closeModal} className="rounded-xl border border-border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void submitPending()}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {saving ? "Sending…" : "Send popup"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["pending", "approved", "rejected", "All"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${tab === t ? "bg-gradient-primary shadow-glow" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {t} <span className="ml-1 text-xs opacity-70">({rows.filter((r) => t === "All" || r.status === t).length})</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Destination</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-card-elevated/40">
                  <td className="px-4 py-3 font-medium">{r.profile_name}</td>
                  <td className="px-4 py-3 capitalize">{r.method}</td>
                  <td className="px-4 py-3 font-semibold">${Number(r.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px]">
                    {r.method === "usdt" ? (
                      <span className="font-mono break-all">{r.usdt_address ?? "—"}</span>
                    ) : (
                      <div className="space-y-0.5">
                        {r.account_name && (
                          <div>
                            <span className="text-foreground/60">Name:</span> {r.account_name}
                          </div>
                        )}
                        {r.bank_name && (
                          <div>
                            <span className="text-foreground/60">Bank:</span> {r.bank_name}
                          </div>
                        )}
                        {r.account_number && (
                          <div>
                            <span className="text-foreground/60">Acc#:</span> <span className="font-mono">{r.account_number}</span>
                          </div>
                        )}
                        {r.iban && (
                          <div>
                            <span className="text-foreground/60">IBAN:</span> <span className="font-mono">{r.iban}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "pending" && (
                      <div className="flex items-center gap-1 justify-end flex-wrap">
                        <button
                          type="button"
                          title="Approve"
                          onClick={() => openApprove(r)}
                          className="p-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Reject"
                          onClick={() => openReject(r)}
                          className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Pending popup only"
                          onClick={() => openPending(r)}
                          className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                    No requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
