import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, Gamepad2, Gift, User } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/deposit", label: "Deposit", icon: Wallet },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/offers", label: "Offers", icon: Gift },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md relative pb-24 min-h-screen">
        {children}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur border-t border-border">
          <div className="grid grid-cols-5">
            {navItems.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 py-3 text-xs transition-colors ${active ? "text-primary-glow" : "text-muted-foreground"}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
