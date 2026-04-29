import { Link } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";

export function PageHeader({ title, back = "/" }: { title: string; back?: string }) {
  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-border">
      <Link to={back} className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-elevated transition">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="text-lg font-semibold">{title}</h1>
      <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center relative">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
      </button>
    </header>
  );
}

export function StepIndicator({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const active = n <= step;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground border border-border"}`}>
              {n}
            </div>
            {n < total && <div className={`w-12 h-0.5 ${n < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}
