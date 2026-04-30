import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Settings, User, Shield, Landmark, History, HelpCircle, LogOut, Wallet } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";

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
          <div className="min-w-0">
            <p className="text-xl font-bold truncate">{user?.user_metadata?.full_name ?? user?.email ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground font-mono">{user?.id.slice(0, 8)}</p>
          </div>
        </div>

        <Link to="/wallet" className="flex items-center justify-between bg-gradient-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-primary-glow" />
            <div>
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <p className="text-xl font-bold">${(wallet?.balance ?? 0).toFixed(2)}</p>
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
