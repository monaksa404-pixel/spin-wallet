// Shared prize pool used by every game. Each prize describes how the reward is computed
// from the bet (in USDT, after coins -> USDT conversion at admin approval time).
export type PrizeKind = "multiplier" | "percent";
export type Prize = {
  label: string;
  kind: PrizeKind;
  value: number;
  color: string;
};

export const STANDARD_PRIZES: Prize[] = [
  { label: "1X",  kind: "multiplier", value: 1,  color: "#ec4899" },
  { label: "2X",  kind: "multiplier", value: 2,  color: "#a855f7" },
  { label: "4X",  kind: "multiplier", value: 4,  color: "#10b981" },
  { label: "8X",  kind: "multiplier", value: 8,  color: "#3b82f6" },
  { label: "10X", kind: "multiplier", value: 10, color: "#f59e0b" },
  { label: "15X", kind: "multiplier", value: 15, color: "#22c55e" },
  { label: "20X", kind: "multiplier", value: 20, color: "#ef4444" },
  { label: "50X", kind: "multiplier", value: 50, color: "#eab308" },
];

export const computeUsdt = (p: Prize, betUsdt: number) => {
  if (p.kind === "multiplier") return betUsdt * p.value;
  return betUsdt * (p.value / 100);
};

export type GameId = "luck_wheel" | "slot_machine" | "lucky_box" | "bonus_drop";

export const GAMES: { id: GameId; name: string; tagline: string; emoji: string; path: string }[] = [
  { id: "luck_wheel", name: "Luck Wheel", tagline: "Spin the wheel of fortune", emoji: "🎡", path: "/games/luck-wheel" },
];

// Currency conversion (mid-market approximations, USDT pegged to USD).
// Users can edit later; values are static here.
export type CurrencyCode = "USD" | "SAR" | "AED" | "QAR" | "KWD" | "OMR" | "BHD" | "PKR" | "INR";
export const CURRENCIES: { code: CurrencyCode; symbol: string; rate: number; name: string }[] = [
  { code: "USD", symbol: "$",   rate: 1,      name: "US Dollar (USDT)" },
  { code: "SAR", symbol: "ر.س", rate: 3.75,   name: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", rate: 3.6725, name: "UAE Dirham" },
  { code: "QAR", symbol: "ر.ق", rate: 3.64,   name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", rate: 0.307,  name: "Kuwaiti Dinar" },
  { code: "OMR", symbol: "ر.ع", rate: 0.385,  name: "Omani Rial" },
  { code: "BHD", symbol: "د.ب", rate: 0.376,  name: "Bahraini Dinar" },
  { code: "PKR", symbol: "₨",   rate: 278,    name: "Pakistani Rupee" },
  { code: "INR", symbol: "₹",   rate: 83.5,   name: "Indian Rupee" },
];

export const fmtCurrency = (usdt: number, code: CurrencyCode) => {
  const c = CURRENCIES.find((x) => x.code === code) ?? CURRENCIES[0];
  const v = (usdt || 0) * c.rate;
  const decimals = c.code === "PKR" || c.code === "INR" ? 0 : 2;
  return `${c.symbol}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const COINS_PER_USDT = 100;

const PRIZE_WEIGHTS: Record<string, number> = {
  "1X":  35,
  "2X":  28,
  "4X":  16,
  "8X":  10,
  "10X": 5,
  "15X": 3,
  "20X": 2,
  "50X": 1,
};

export function pickWeightedPrizeIndex(prizes: Prize[] = STANDARD_PRIZES): number {
  const weighted = prizes.map((p) => PRIZE_WEIGHTS[p.label] ?? 0);
  const total = weighted.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return 0;
  let roll = Math.random() * total;
  for (let i = 0; i < weighted.length; i++) {
    roll -= Math.max(0, weighted[i]);
    if (roll < 0) return i;
  }
  return weighted.length - 1;
}
