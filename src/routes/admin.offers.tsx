import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OFFER_SLOTS_ORDERED, offerImageSrc, type OfferSlotId } from "@/lib/offer-config";

export const Route = createFileRoute("/admin/offers")({
  head: () => ({ meta: [{ title: "Offers — Admin" }] }),
  component: AdminOffers,
});

type PromoRow = { id: OfferSlotId; bonus_label: string };

function AdminOffers() {
  const [labels, setLabels] = useState<Record<OfferSlotId, string>>({
    offer1: "5X",
    offer2: "5X",
    offer3: "5X",
    offer4: "5X",
    offer5: "5X",
  });
  const [saving, setSaving] = useState<OfferSlotId | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("offer_promotions").select("id, bonus_label").order("id");
    if (error) {
      toast.error(error.message);
      return;
    }
    setLabels((prev) => {
      const next = { ...prev };
      for (const row of (data ?? []) as PromoRow[]) {
        next[row.id] = row.bonus_label ?? prev[row.id];
      }
      return next;
    });
  };

  useEffect(() => {
    void load();
  }, []);

  const saveOne = async (id: OfferSlotId) => {
    const raw = labels[id]?.trim() ?? "";
    if (!raw) {
      toast.error("Bonus label cannot be empty");
      return;
    }
    setSaving(id);
    const { error } = await supabase.from("offer_promotions").update({ bonus_label: raw }).eq("id", id);
    setSaving(null);
    if (error) toast.error(error.message);
    else {
      toast.success(`Saved ${id}`);
      await load();
    }
  };

  return (
    <AdminShell title="Offers & promotions">
      <p className="text-sm text-muted-foreground mb-6 max-w-xl">
        Bonus labels appear on each offer banner as{" "}
        <strong className="text-foreground">&quot;{'{label}'} Bonus&quot;</strong> next to the fire icon on the home carousel and Offers tab.
        Deposits from these buttons stay <strong className="text-foreground">pending</strong> until you approve them on Deposits.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {OFFER_SLOTS_ORDERED.map((slot) => (
          <div key={slot.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-44 shrink-0 bg-muted aspect-video sm:aspect-auto sm:min-h-[140px]">
              <img src={offerImageSrc(slot.imageFile)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-4 flex flex-col gap-3">
              <div>
                <p className="text-xs font-mono text-muted-foreground">{slot.id}</p>
                <p className="text-sm font-semibold">{slot.depositButtonLabel}</p>
              </div>
              <label className="block text-xs text-muted-foreground">
                Bonus label (e.g. 5X, 3X, 10X)
                <input
                  value={labels[slot.id] ?? ""}
                  onChange={(e) => setLabels((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                  className="mt-1 w-full bg-input border border-border rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                  placeholder="5X"
                />
              </label>
              <button
                type="button"
                disabled={saving === slot.id}
                onClick={() => void saveOne(slot.id)}
                className="sm:self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-sm font-semibold shadow-glow disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving === slot.id ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
