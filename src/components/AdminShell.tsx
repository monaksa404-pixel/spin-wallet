import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, Disc3, Gift, Sparkles, LogOut, Bell } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { to: "/admin/spin", label: "Game Rewards", icon: Disc3 },
  { to: "/admin/offers", label: "Offers", icon: Gift },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && !isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  const logout = async () => { await signOut(); navigate({ to: "/login" }); };

  if (loading || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card/40 flex-col">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-gradient">GameBonus</p>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}>
                <Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40">
          <h1 className="text-xl font-bold">{title}</h1>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-card flex items-center justify-center relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold">{(user?.email ?? "A")[0].toUpperCase()}</div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-[10px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="p-6 pb-24 md:pb-6">{children}</div>
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border grid grid-cols-6">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${active ? "text-primary-glow" : "text-muted-foreground"}`}>
                <Icon className="w-4 h-4" />
                {n.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

export function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${accent ?? ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    approved: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
    active: "bg-success/15 text-success",
    banned: "bg-destructive/15 text-destructive",
  };
  const k = status.toLowerCase();
  return <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${map[k] ?? "bg-muted/40"}`}>{status}</span>;
}
