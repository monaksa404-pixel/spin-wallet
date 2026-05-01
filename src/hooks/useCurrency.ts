import { useEffect, useState } from "react";
import type { CurrencyCode } from "@/lib/games";

const KEY = "gb_currency";
const listeners = new Set<(c: CurrencyCode) => void>();

export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window === "undefined") return "USD";
    return (localStorage.getItem(KEY) as CurrencyCode) || "USD";
  });

  useEffect(() => {
    const fn = (c: CurrencyCode) => setCurrencyState(c);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    localStorage.setItem(KEY, c);
    listeners.forEach((l) => l(c));
  };

  return { currency, setCurrency };
}
