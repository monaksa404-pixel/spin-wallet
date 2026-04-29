import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/deposit/pending")({
  head: () => ({ meta: [{ title: "Pending — GameBonus" }] }),
  component: Pending,
});

function Pending() {
  return (
    <MobileShell>
      <PageHeader title="Submission Received" back="/deposit" />
      <div className="px-6 py-10 flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-warning/15 flex items-center justify-center">
          <Clock className="w-12 h-12 text-warning" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pending Approval</h2>
          <p className="text-muted-foreground mt-2 text-sm">Your deposit has been submitted and is being reviewed.</p>
        </div>
        <div className="w-full bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground uppercase">Estimated Time</p>
          <p className="text-4xl font-bold text-warning mt-1">02:00:00</p>
          <p className="text-xs text-muted-foreground mt-1">Hours : Minutes : Seconds</p>
        </div>
        <Link to="/" className="w-full bg-gradient-primary py-4 rounded-xl font-semibold shadow-glow text-center">Back to Home</Link>
      </div>
    </MobileShell>
  );
}
