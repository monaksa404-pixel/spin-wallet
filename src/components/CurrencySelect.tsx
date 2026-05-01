import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/lib/games";

export function CurrencySelect({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as any)}
      className={`bg-card border border-border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-primary ${className}`}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>{c.code}</option>
      ))}
    </select>
  );
}
