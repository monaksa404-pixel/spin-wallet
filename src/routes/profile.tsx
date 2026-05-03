import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Settings, User, Shield, Landmark, History, HelpCircle, LogOut, Wallet, Pencil, Check, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — GameBonus" }] }),
  component: ProfilePage,
});

const items = [
  { icon: User, label: "Personal Information" },
  { icon: Shield, label: "Security" },
  { icon: Landmark, label: "Bank Accounts" },
  { icon: History, label: "Transaction History", to: "/wallet" as const },
  { icon: HelpCircle, label: "Support" },
];

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { wallet } = useWallet(user?.id);
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const startEdit = () => {
    setNewName(user?.user_metadata?.full_name ?? "");
    setEditingName(true);
  };

  const saveName = async () => {
    if (!newName.trim()) { toast.error("Name cannot be empty"); return; }
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName.trim() } });
    if (error) { toast.error(error.message); return; }
    if (user) {
      await supabase.from("profiles").update({ full_name: newName.trim() }).eq("id", user.id);
    }
    setEditingName(false);
    toast.success("Username updated");
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <MobileShell>
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <h1 className="text-lg font-semibold">Profile</h1>
        <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center"><Settings className="w-5 h-5" /></button>
      </header>

      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
            <User className="w-8 h-8" />
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="bg-input border border-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary flex-1 min-w-0"
                  autoFocus
                />
                <button type="button" onClick={() => void saveName()} className="p-1.5 rounded-lg bg-success/20 text-success"><Check className="w-4 h-4" /></button>
                <button type="button" onClick={() => setEditingName(false)} className="p-1.5 rounded-lg bg-destructive/20 text-destructive"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xl font-bold truncate">{user?.user_metadata?.full_name ?? user?.email ?? "Guest"}</p>
                <button type="button" onClick={startEdit} className="text-muted-foreground hover:text-foreground shrink-0">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground font-mono">{user?.id.slice(0, 8)}</p>
          </div>
        </div>

        <Link to="/wallet" className="flex items-center justify-between bg-gradient-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary-glow" />
            <div>
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <p className="text-xl font-bold">${((wallet?.balance ?? 0) + (wallet?.bonus_balance ?? 0)).toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                ${(wallet?.balance ?? 0).toFixed(2)} deposit · ${(wallet?.bonus_balance ?? 0).toFixed(2)} bonus
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {items.map((it) => {
            const inner = (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center"><it.icon className="w-4 h-4 text-primary-glow" /></div>
                  <span className="text-sm font-medium">{it.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </>
            );
            return it.to ? (
              <Link key={it.label} to={it.to} className="flex items-center justify-between p-3 hover:bg-card-elevated transition">{inner}</Link>
            ) : (
              <button key={it.label} className="w-full flex items-center justify-between p-3 hover:bg-card-elevated transition">{inner}</button>
            );
          })}
          <button onClick={handleLogout} className="w-full flex items-center justify-between p-3 text-destructive">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
              <span className="text-sm font-medium">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
