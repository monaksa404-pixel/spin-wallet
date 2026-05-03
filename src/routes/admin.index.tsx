import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, CalendarClock, Building2, Timer } from "lucide-react";
import { OFFER_SLOTS_ORDERED } from "@/lib/offer-config";
import { AdminShell, StatCard, StatusPill } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — GameBonus" }] }),
  component: AdminDashboard,
});

type ProfileRow = { id: string; full_name: string | null };
type DepositRecent = { user_id: string; method: string; amount: number | null; requested_amount: number | null; status: string; created_at: string };
type WithdrawRecent = { user_id: string; method: string; amount: number; status: string; created_at: string };

type RecentRow = {
  user: string;
  method: string;
  amount: string;
  status: string;
  time: string;
};

type DepositSetting = { key: string; value: string };
type UserRow = { id: string; full_name: string | null };

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0, pending: 0 });
  const [recentDep, setRecentDep] = useState<RecentRow[]>([]);
  const [recentWd, setRecentWd] = useState<RecentRow[]>([]);
  const [offerUserSearch, setOfferUserSearch] = useState("");
  const [offerUserResults, setOfferUserResults] = useState<UserRow[]>([]);
  const [offerSelectedUser, setOfferSelectedUser] = useState<UserRow | null>(null);
  const [offerSelectedId, setOfferSelectedId] = useState(OFFER_SLOTS_ORDERED[0].id as string);
  const [offerExpiry, setOfferExpiry] = useState("");
  const [offerSaving, setOfferSaving] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userDeadline, setUserDeadline] = useState("");
  const [userDeadlineSaving, setUserDeadlineSaving] = useState(false);

  const [depSettings, setDepSettings] = useState<Record<string, string>>({});
  const [depSettingsSaving, setDepSettingsSaving] = useState(false);

  const loadDepSettings = async () => {
    const { data } = await supabase.from("deposit_settings").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      (data as DepositSetting[]).forEach((r) => { map[r.key] = r.value; });
      setDepSettings(map);
    }
  };

  const saveDepSettings = async () => {
    setDepSettingsSaving(true);
    const updates = Object.entries(depSettings).map(([key, value]) =>
      supabase.from("deposit_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key)
    );
    const results = await Promise.all(updates);
    setDepSettingsSaving(false);
    const err = results.find((r) => r.error);
    if (err?.error) toast.error(err.error.message);
    else toast.success("Deposit details saved");
  };

  const searchOfferUsers = async (q: string) => {
    if (!q.trim()) { setOfferUserResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name").ilike("full_name", `%${q.trim()}%`).limit(8);
    setOfferUserResults((data ?? []) as UserRow[]);
  };

  const saveOfferCountdown = async () => {
    if (!offerSelectedUser) { toast.error("Select a user first"); return; }
    if (!offerExpiry) { toast.error("Pick an expiry date/time"); return; }
    setOfferSaving(true);
    const { error } = await supabase.rpc("admin_set_offer_countdown", {
      _user_id: offerSelectedUser.id,
      _offer_id: offerSelectedId,
      _expires_at: new Date(offerExpiry).toISOString(),
    });
    setOfferSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`Countdown set for ${offerSelectedUser.full_name ?? offerSelectedUser.id}`);
      setOfferSelectedUser(null);
      setOfferUserSearch("");
      setOfferUserResults([]);
      setOfferExpiry("");
    }
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setUserResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, full_name").ilike("full_name", `%${q.trim()}%`).limit(8);
    setUserResults((data ?? []) as UserRow[]);
  };

  const setUserDeadlineAction = async () => {
    if (!selectedUser) { toast.error("Select a user first"); return; }
    if (!userDeadline) { toast.error("Pick a deadline date/time"); return; }
    setUserDeadlineSaving(true);
    const { error } = await supabase.rpc("admin_set_user_deadline", {
      _user_id: selectedUser.id,
      _deadline_at: new Date(userDeadline).toISOString(),
    });
    setUserDeadlineSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`Deadline set for ${selectedUser.full_name ?? selectedUser.id}`);
      setSelectedUser(null);
      setUserSearch("");
      setUserResults([]);
      setUserDeadline("");
    }
  };

  const load = async () => {
    const [users, deps, wds, pendD, pendW, pendS, recD, recW] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("amount").eq("kind", "deposit"),
      supabase.from("transactions").select("amount").eq("kind", "withdrawal"),
      supabase.from("deposits").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("spin_rewards").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("deposits").select("user_id, method, amount, requested_amount, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("withdrawals").select("user_id, method, amount, status, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    setStats({
      users: users.count ?? 0,
      deposits: (deps.data ?? []).reduce((s, t) => s + Number(t.amount || 0), 0),
      withdrawals: Math.abs((wds.data ?? []).reduce((s, t) => s + Number(t.amount || 0), 0)),
      pending: (pendD.count ?? 0) + (pendW.count ?? 0) + (pendS.count ?? 0),
    });

    const depRows = (recD.data ?? []) as DepositRecent[];
    const wdRows = (recW.data ?? []) as WithdrawRecent[];
    const userIds = Array.from(new Set([...depRows.map((r) => r.user_id), ...wdRows.map((r) => r.user_id)]));

    let profileMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p.full_name ?? "—"]));
    }

    setRecentDep(
      depRows.map((r) => ({
        user: profileMap.get(r.user_id) ?? "—",
        method: r.method,
        amount: `$${Number(r.amount ?? r.requested_amount ?? 0).toFixed(2)}`,
        status: r.status,
        time: new Date(r.created_at).toLocaleTimeString(),
      })),
    );

    setRecentWd(
      wdRows.map((r) => ({
        user: profileMap.get(r.user_id) ?? "—",
        method: r.method,
        amount: `$${Number(r.amount).toFixed(2)}`,
        status: r.status,
        time: new Date(r.created_at).toLocaleTimeString(),
      })),
    );
  };

  useEffect(() => {
    void loadDepSettings();
    void load();
    const ch = supabase
      .channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "spin_rewards" }, () => void load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <AdminShell title="Dashboard Overview">
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="font-semibold">Set offer countdown for a user</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Search a user, choose an offer, and set an expiry time. The countdown shows on that offer card for that user only. When time runs out it disappears automatically.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <input
              value={offerUserSearch}
              onChange={(e) => { setOfferUserSearch(e.target.value); void searchOfferUsers(e.target.value); }}
              placeholder="Search user by name…"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {offerUserResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {offerUserResults.map((u) => (
                  <button key={u.id} type="button"
                    onClick={() => { setOfferSelectedUser(u); setOfferUserSearch(u.full_name ?? u.id); setOfferUserResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition"
                  >
                    {u.full_name ?? u.id}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            value={offerSelectedId}
            onChange={(e) => setOfferSelectedId(e.target.value)}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {OFFER_SLOTS_ORDERED.map((s) => (
              <option key={s.id} value={s.id}>{s.depositButtonLabel}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={offerExpiry}
            onChange={(e) => setOfferExpiry(e.target.value)}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={offerSaving}
            onClick={() => void saveOfferCountdown()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-sm font-semibold shadow-glow disabled:opacity-60 whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            Set Countdown
          </button>
        </div>
        {offerSelectedUser && (
          <p className="text-xs text-green-400">
            Selected: <span className="font-semibold">{offerSelectedUser.full_name ?? offerSelectedUser.id}</span>
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <CalendarClock className="w-5 h-5 text-primary-glow" />
          </div>
          <div>
            <p className="font-semibold">Set countdown deadline for a user</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Search a user by name and assign a specific date/time deadline. The countdown banner will appear for that user until they deposit and it's approved.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <input
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); void searchUsers(e.target.value); }}
              placeholder="Search user by name…"
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            {userResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                {userResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setSelectedUser(u); setUserSearch(u.full_name ?? u.id); setUserResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition"
                  >
                    {u.full_name ?? u.id}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="datetime-local"
            value={userDeadline}
            onChange={(e) => setUserDeadline(e.target.value)}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={userDeadlineSaving}
            onClick={() => void setUserDeadlineAction()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-sm font-semibold shadow-glow disabled:opacity-60 whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            Set Deadline
          </button>
        </div>
        {selectedUser && (
          <p className="text-xs text-primary-glow">
            Selected: <span className="font-semibold">{selectedUser.full_name ?? selectedUser.id}</span>
          </p>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold">Deposit instructions (shown to users)</p>
            <p className="text-xs text-muted-foreground mt-1">Edit the bank account details and USDT wallet address that users see when depositing.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: "usdt_trc20_address", label: "USDT TRC20 Wallet Address", mono: true },
            { key: "bank_name",          label: "Bank Name",                 mono: false },
            { key: "bank_account_name",  label: "Account Name",              mono: false },
            { key: "bank_account_number",label: "Account Number",            mono: true  },
            { key: "bank_iban",          label: "IBAN",                      mono: true  },
          ].map(({ key, label, mono }) => (
            <label key={key} className={`block text-xs ${key === "usdt_trc20_address" || key === "bank_iban" ? "sm:col-span-2" : ""}`}>
              <span className="text-muted-foreground">{label}</span>
              <input
                value={depSettings[key] ?? ""}
                onChange={(e) => setDepSettings((prev) => ({ ...prev, [key]: e.target.value }))}
                className={`mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary ${mono ? "font-mono" : ""}`}
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={depSettingsSaving}
          onClick={() => void saveDepSettings()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-sm font-semibold shadow-glow disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          Save deposit details
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={String(stats.users)} />
        <StatCard label="Total Deposits" value={`$${stats.deposits.toFixed(2)}`} accent="text-success" />
        <StatCard label="Total Withdrawals" value={`$${stats.withdrawals.toFixed(2)}`} accent="text-primary-glow" />
        <StatCard label="Pending Requests" value={String(stats.pending)} sub="Needs review" accent="text-warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <RecentTable title="Recent Deposits" rows={recentDep} />
        <RecentTable title="Recent Withdrawals" rows={recentWd} />
      </div>
    </AdminShell>
  );
}

function RecentTable({ title, rows }: { title: string; rows: RecentRow[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No records yet</p>}
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between p-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-xs shrink-0">{r.user[0]}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.user}</p>
                <p className="text-xs text-muted-foreground truncate">{r.method} · {r.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold">{r.amount}</span>
              <StatusPill status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
