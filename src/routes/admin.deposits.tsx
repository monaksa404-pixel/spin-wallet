import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { Check, ChevronUp, Pencil, X } from "lucide-react";
import { AdminShell, StatusPill } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
};
type ProfileRow = { id: string; full_name: string | null };
type Row = BaseRow & { profile_name: string };

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bankDrafts, setBankDrafts] = useState<Record<string, BankDraft>>({});
  const [usdtDrafts, setUsdtDrafts] = useState<Record<string, UsdtDraft>>({});

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

  const approve = async (r: Row) => {
    const amt = Number(amounts[r.id] ?? r.requested_amount ?? 0);
    if (!amt || amt <= 0) {
      toast.error("Enter approval amount");
      return;
    }
    const { error } = await supabase.rpc("approve_deposit", { _id: r.id, _amount: amt });
    if (error) toast.error(error.message);
    else {
      toast.success("Approved & credited");
      await load();
    }
  };

  const reject = async (r: Row) => {
    const note = window.prompt("Rejection reason (optional)") ?? "";
    const { error } = await supabase.rpc("reject_deposit", { _id: r.id, _note: note });
    if (error) toast.error(error.message);
    else {
      toast.success("Rejected");
      await load();
    }
  };

  return (
    <AdminShell title="Deposit Requests">
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
                <th className="text-left px-4 py-3">Details</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Payer account #</th>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-left px-4 py-3">Approve $</th>
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
                              <button onClick={() => void approve(r)} className="p-1.5 rounded-lg bg-success/15 text-success hover:bg-success/25" title="Approve">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => void reject(r)} className="p-1.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && r.method === "bank" && (
                      <tr className="bg-muted/20 border-t border-border">
                        <td colSpan={8} className="px-4 py-4">
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
                        <td colSpan={8} className="px-4 py-4">
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
                  <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
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
