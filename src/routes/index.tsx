import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Menu, Wallet, Gift, AlarmClock, ArrowDownToLine, ArrowUpFromLine, Disc3, Tag } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GameBonus — Play, Win & Redeem" },
      { name: "description", content: "Deposit, win and redeem rewards with GameBonus." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MobileShell>
      <header className="flex items-center justify-between px-4 py-4">
        <button className="w-10 h-10 rounded-lg bg-card flex items-center justify-center"><Menu className="w-5 h-5" /></button>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-foreground">Game</span><span className="text-primary-glow">Bonus</span>
          </h1>
          <p className="text-xs text-muted-foreground">Play, Win & Redeem</p>
        </div>
        <Link to="/profile" className="w-10 h-10 rounded-full bg-card flex items-center justify-center relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center">3</span>
        </Link>
      </header>

      <div className="px-4 space-y-4">
        {/* Total Balance */}
        <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Balance</p>
            <p className="text-3xl font-bold">$653.00</p>
          </div>
        </div>

        {/* Bonus + Pending */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary-glow" />
              <span className="text-xs text-muted-foreground uppercase">Bonus Balance</span>
            </div>
            <p className="text-2xl font-bold text-primary-glow">$150.00</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlarmClock className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground uppercase">Pending</span>
            </div>
            <p className="text-2xl font-bold text-destructive">$50.00</p>
          </div>
        </div>

        {/* Bonus card */}
        <div className="bg-gradient-bonus rounded-2xl p-5 relative overflow-hidden shadow-card">
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-wider opacity-80">Deposit & Get</p>
            <p className="text-4xl font-extrabold mt-1">5X BONUS</p>
            <p className="text-xs opacity-80 mt-1">Limited Time Offer</p>
            <Link to="/deposit" className="inline-block mt-3 px-4 py-2 bg-background/30 backdrop-blur rounded-lg text-sm font-semibold border border-white/20">
              Deposit Now
            </Link>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-7xl opacity-30">🎁</div>
        </div>

        {/* Bonus expires timer */}
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bonus Expires In</p>
          <div className="flex items-center justify-center gap-2 font-mono">
            {[
              { v: "01", l: "HRS" },
              { v: "03", l: "MINS" },
              { v: "00", l: "SECS" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="bg-background border border-primary/40 rounded-lg px-3 py-2 min-w-[3rem]">
                  <p className="text-2xl font-bold text-primary-glow">{t.v}</p>
                  <p className="text-[10px] text-muted-foreground">{t.l}</p>
                </div>
                {i < 2 && <span className="text-primary-glow text-xl">:</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-sm font-semibold mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { to: "/deposit", icon: ArrowDownToLine, label: "Deposit" },
              { to: "/withdraw", icon: ArrowUpFromLine, label: "Withdraw" },
              { to: "/spin", icon: Disc3, label: "Spin Wheel" },
              { to: "/offers", icon: Tag, label: "Offers" },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="bg-card border border-border rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-primary transition">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-center">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
