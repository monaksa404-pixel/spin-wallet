import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { Check, ChevronUp, Pencil, X, Bell } from "lucide-react";
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

export const Route = createFileRoute("/admin/deposits")({
  head: () => ({ meta: [{ title: "Deposits — Admin" }] }),
  component: AdminDeposits,
});

type Status = "pending" | "approved" | "rejected";
type BaseRow = {
  id: string;
  user_id: string;
  method: string;
  amount: number | null;
  requested_amount: number | null;
  gift_card_brand: string | null;
  gift_card_code: string | null;
  usdt_tx_address: string | null;
  payer_account_name: string | null;
  payer_account_number: string | null;
  payer_iban: string | null;
  status: Status;
  created_at: string;
  bonus_amount?: number | null;
};
type ProfileRow = { id: string; full_name: string | null };
type Row = BaseRow & { profile_name: string };

function formatDepositSubmitted(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const tz = Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")?.value;
  return tz ? `${datePart} — ${timePart} ${tz}` : `${datePart} — ${timePart}`;
}

type ModalKind = "approve" | "reject" | "pending" | null;

const DEF_DEPOSIT_APPROVE_TITLE = "Deposit approved";
const DEF_DEPOSIT_APPROVE_MSG = "Your deposit was approved and credited to your balance.";
const DEF_DEPOSIT_REJECT_TITLE = "Deposit declined";
const DEF_DEPOSIT_REJECT_MSG = "Your deposit could not be approved.";
const DEF_DEPOSIT_PENDING_TITLE = "Deposit update";
const DEF_DEPOSIT_PENDING_MSG = "Your deposit is still being reviewed.";

type BankDraft = {
  payer_account_name: string;
  payer_account_number: string;
  payer_iban: string;
  requested_amount: string;
};

type UsdtDraft = {
  usdt_tx_address: string;
  requested_amount: string;
};

function bankDraftFromRow(r: Row): BankDraft {
  return {
    payer_account_name: r.payer_account_name ?? "",
    payer_account_number: r.payer_account_number ?? "",
    payer_iban: r.payer_iban ?? "",
    requested_amount: r.requested_amount != null ? String(r.requested_amount) : "",
  };
}

function usdtDraftFromRow(r: Row): UsdtDraft {
  return {
    usdt_tx_address: r.usdt_tx_address ?? "",
    requested_amount: r.requested_amount != null ? String(r.requested_amount) : "",
  };
}

function AdminDeposits() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"All" | Status>("pending");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [bonuses, setBonuses] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bankDrafts, setBankDrafts] = useState<Record<string, BankDraft>>({});
  const [usdtDrafts, setUsdtDrafts] = useState<Record<string, UsdtDraft>>({});
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeRow, setActiveRow] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [approveTitle, setApproveTitle] = useState(DEF_DEPOSIT_APPROVE_TITLE);
  const [approveMsg, setApproveMsg] = useState(DEF_DEPOSIT_APPROVE_MSG);
  const [rejectTitle, setRejectTitle] = useState(DEF_DEPOSIT_REJECT_TITLE);
  const [rejectMsg, setRejectMsg] = useState(DEF_DEPOSIT_REJECT_MSG);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingTitle, setPendingTitle] = useState(DEF_DEPOSIT_PENDING_TITLE);
  const [pendingMsg, setPendingMsg] = useState(DEF_DEPOSIT_PENDING_MSG);

  const openApprove = (r: Row) => {
    setActiveRow(r);
    setApproveTitle(DEF_DEPOSIT_APPROVE_TITLE);
    setApproveMsg(DEF_DEPOSIT_APPROVE_MSG);
    setModal("approve");
  };

  const openReject = (r: Row) => {
    setActiveRow(r);
    setRejectTitle(DEF_DEPOSIT_REJECT_TITLE);
    setRejectMsg(DEF_DEPOSIT_REJECT_MSG);
    setRejectReason("");
    setModal("reject");
  };

  const openPending = (r: Row) => {
    setActiveRow(r);
    setPendingTitle(DEF_DEPOSIT_PENDING_TITLE);
    setPendingMsg(DEF_DEPOSIT_PENDING_MSG);
    setModal("pending");
  };

  const closeModal = () => {
    setModal(null);
    setActiveRow(null);
  };

  const load = async () => {
    const { data, error } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
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
      .channel("admin-deps")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, () => void load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = rows.filter((r) => tab === "All" || r.status === tab);

  const toggleEdit = (r: Row) => {
    if (r.status !== "pending") return;
    if (expandedId === r.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(r.id);
    if (r.method === "bank") {
      setBankDrafts((prev) => (prev[r.id] ? prev : { ...prev, [r.id]: bankDraftFromRow(r) }));
    } else if (r.method === "usdt") {
      setUsdtDrafts((prev) => (prev[r.id] ? prev : { ...prev, [r.id]: usdtDraftFromRow(r) }));
    }
  };

  const saveBankDraft = async (r: Row) => {
    const d = bankDrafts[r.id] ?? bankDraftFromRow(r);
    const rq = Number(d.requested_amount);
    if (!d.payer_account_name.trim() || !d.payer_account_number.trim() || !d.payer_iban.trim()) {
      toast.error("Fill payer name, account number, and IBAN");
      return;
    }
    if (!rq || rq <= 0) {
      toast.error("Requested amount must be greater than zero");
      return;
    }
    const { error } = await supabase
      .from("deposits")
      .update({
        payer_account_name: d.payer_account_name.trim(),
        payer_account_number: d.payer_account_number.trim(),
        payer_iban: d.payer_iban.trim(),
        requested_amount: rq,
      })
      .eq("id", r.id)
      .eq("status", "pending");
    if (error) { toast.error(error.message); return; }
    toast.success("Bank details saved");
    await load();
  };

  const saveUsdtDraft = async (r: Row) => {
    const d = usdtDrafts[r.id] ?? usdtDraftFromRow(r);
    const rq = Number(d.requested_amount);
    if (!d.usdt_tx_address.trim()) {
      toast.error("Enter wallet / TX address");
      return;
    }
    if (!rq || rq <= 0) {
      toast.error("Requested amount must be greater than zero");
      return;
    }
    const { error } = await supabase
      .from("deposits")
      .update({
        usdt_tx_address: d.usdt_tx_address.trim(),
        requested_amount: rq,
      })
      .eq("id", r.id)
      .eq("status", "pending");
    if (error) { toast.error(error.message); return; }
    toast.success("USDT details saved");
    await load();
  };

  const submitApprove = async () => {
    if (!activeRow) return;
    const amt = Number(amounts[activeRow.id] ?? activeRow.requested_amount ?? 0);
    if (!amt || amt <= 0) {
      toast.error("Enter approval amount");
      return;
    }
    const bonus = Number(bonuses[activeRow.id] ?? 0) || 0;
    setSaving(true);
    const { error } = await supabase.rpc("approve_deposit", {
      _id: activeRow.id,
      _amount: amt,
      _bonus: bonus,
      _popup_title: approveTitle.trim() || null,
      _popup_message: approveMsg.trim() || null,
    } satisfies Database["public"]["Functions"]["approve_deposit"]["Args"]);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(bonus > 0 ? `Approved — $${amt.toFixed(2)} + $${bonus.toFixed(2)} bonus credited` : "Approved & credited");
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
    const { error } = await supabase.rpc("reject_deposit", {
      _id: activeRow.id,
      _popup_title: rejectTitle.trim(),
      _popup_message: rejectMsg.trim(),
      _failure_reason: rejectReason.trim(),
    } satisfies Database["public"]["Functions"]["reject_deposit"]["Args"]);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Rejected");
      closeModal();
      await load();
    }
  };

  const submitPending = async () => {
    if (!activeRow) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_deposit_pending_notice", {
      _deposit_id: activeRow.id,
      _popup_title: pendingTitle.trim(),
      _popup_message: pendingMsg.trim(),
    } satisfies Database["public"]["Functions"]["admin_deposit_pending_notice"]["Args"]);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Status update queued for user");
      closeModal();
      await load();
    }
  };

  return (
    <AdminShell title="Deposit Requests">
      <Dialog open={modal === "approve"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="max-w-md border-primary/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Approve deposit</DialogTitle>
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
            <DialogTitle>Reject deposit</DialogTitle>
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
                placeholder="e.g. Payment proof unclear"
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
          <p className="text-xs text-muted-foreground">Sends a yellow pending popup only. Deposit stays pending.</p>
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
                <th className="text-left px-4 py-3 whitespace-nowrap min-w-[10rem]">Submitted</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Details</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Payer account #</th>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-left px-4 py-3">Approve $</th>
                <th className="text-left px-4 py-3">Bonus $</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const bankDraft = bankDrafts[r.id] ?? bankDraftFromRow(r);
                const usdtDraft = usdtDrafts[r.id] ?? usdtDraftFromRow(r);
                const isExpanded = expandedId === r.id && r.status === "pending" && (r.method === "bank" || r.method === "usdt");
                return (
                  <Fragment key={r.id}>
                    <tr className="hover:bg-card-elevated/40">
                      <td className="px-4 py-3 font-medium">{r.profile_name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDepositSubmitted(r.created_at)}</td>
                      <td className="px-4 py-3 capitalize">{r.method.replace("_", " ")}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[280px]">
                        <div className="truncate">
                          {r.method === "gift_card" && `${r.gift_card_brand}: ${r.gift_card_code}`}
                          {r.method === "usdt" && (r.usdt_tx_address || "—")}
                          {r.method === "bank" && (
                            <span className="space-x-1">
                              <span>{r.payer_account_name ?? "—"}</span>
                              <span className="text-muted-foreground">· IBAN …{String(r.payer_iban ?? "").slice(-6)}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs">
                        {r.method === "bank" ? (r.payer_account_number ?? "—") : r.method === "usdt" ? (r.usdt_tx_address ? `…${r.usdt_tx_address.slice(-8)}` : "—") : "—"}
                      </td>
                      <td className="px-4 py-3">{r.requested_amount ? `$${Number(r.requested_amount).toFixed(2)}` : "—"}</td>
                      <td className="px-4 py-3">
                        {r.status === "pending" ? (
                          <input
                            type="number"
                            placeholder={r.requested_amount ? String(r.requested_amount) : "0"}
                            value={amounts[r.id] ?? ""}
                            onChange={(e) => setAmounts({ ...amounts, [r.id]: e.target.value })}
                            className="w-24 bg-input border border-border rounded-lg px-2 py-1 outline-none focus:border-primary"
                          />
                        ) : r.amount ? (
                          `$${Number(r.amount).toFixed(2)}`
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" ? (
                          <input
                            type="number"
                            placeholder="0"
                            value={bonuses[r.id] ?? ""}
                            onChange={(e) => setBonuses({ ...bonuses, [r.id]: e.target.value })}
                            className="w-24 bg-input border border-border rounded-lg px-2 py-1 outline-none focus:border-primary text-primary-glow"
                          />
                        ) : r.bonus_amount != null && Number(r.bonus_amount) > 0 ? (
                          <span className="text-primary-glow font-semibold">${Number(r.bonus_amount).toFixed(2)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end flex-wrap">
                          {r.status === "pending" && (r.method === "bank" || r.method === "usdt") && (
                            <button
                              type="button"
                              onClick={() => toggleEdit(r)}
                              className="p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
                              title={r.method === "bank" ? "Edit bank details & amount" : "Edit wallet address & amount"}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                            </button>
                          )}
                          {r.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openApprove(r)}
                                className="p-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openReject(r)}
                                className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openPending(r)}
                                className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                                title="Pending popup only"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && r.method === "bank" && (
                      <tr className="bg-muted/20 border-t border-border">
                        <td colSpan={10} className="px-4 py-4">
                          <p className="text-xs font-semibold text-primary-glow mb-3">Edit bank details & amount</p>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="block text-xs">
                              <span className="text-muted-foreground">Account holder name</span>
                              <input
                                value={bankDraft.payer_account_name}
                                onChange={(e) => setBankDrafts((prev) => ({ ...prev, [r.id]: { ...bankDraft, payer_account_name: e.target.value } }))}
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </label>
                            <label className="block text-xs">
                              <span className="text-muted-foreground">Account number</span>
                              <input
                                value={bankDraft.payer_account_number}
                                onChange={(e) => setBankDrafts((prev) => ({ ...prev, [r.id]: { ...bankDraft, payer_account_number: e.target.value } }))}
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                              />
                            </label>
                            <label className="block text-xs sm:col-span-2">
                              <span className="text-muted-foreground">IBAN</span>
                              <input
                                value={bankDraft.payer_iban}
                                onChange={(e) => setBankDrafts((prev) => ({ ...prev, [r.id]: { ...bankDraft, payer_iban: e.target.value } }))}
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                              />
                            </label>
                            <label className="block text-xs">
                              <span className="text-muted-foreground">Requested amount (USD)</span>
                              <input
                                type="number"
                                value={bankDraft.requested_amount}
                                onChange={(e) => setBankDrafts((prev) => ({ ...prev, [r.id]: { ...bankDraft, requested_amount: e.target.value } }))}
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => void saveBankDraft(r)}
                            className="mt-4 px-4 py-2 rounded-xl bg-gradient-primary text-sm font-semibold shadow-glow"
                          >
                            Save changes
                          </button>
                        </td>
                      </tr>
                    )}
                    {isExpanded && r.method === "usdt" && (
                      <tr className="bg-muted/20 border-t border-border">
                        <td colSpan={10} className="px-4 py-4">
                          <p className="text-xs font-semibold text-primary-glow mb-3">Edit USDT wallet address & amount</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block text-xs sm:col-span-2">
                              <span className="text-muted-foreground">Wallet / TX address</span>
                              <input
                                value={usdtDraft.usdt_tx_address}
                                onChange={(e) => setUsdtDrafts((prev) => ({ ...prev, [r.id]: { ...usdtDraft, usdt_tx_address: e.target.value } }))}
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary"
                                placeholder="TRC20 address or TX hash"
                              />
                            </label>
                            <label className="block text-xs">
                              <span className="text-muted-foreground">Requested amount (USD)</span>
                              <input
                                type="number"
                                value={usdtDraft.requested_amount}
                                onChange={(e) => setUsdtDrafts((prev) => ({ ...prev, [r.id]: { ...usdtDraft, requested_amount: e.target.value } }))}
                                className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => void saveUsdtDraft(r)}
                            className="mt-4 px-4 py-2 rounded-xl bg-gradient-primary text-sm font-semibold shadow-glow"
                          >
                            Save changes
                          </button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-muted-foreground text-sm">
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
