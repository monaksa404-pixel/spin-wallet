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
  { label: "0X",  kind: "multiplier", value: 0,  color: "#475569" },
  { label: "2X",  kind: "multiplier", value: 2,  color: "#a855f7" },
  { label: "0X",  kind: "multiplier", value: 0,  color: "#334155" },
  { label: "8X",  kind: "multiplier", value: 8,  color: "#3b82f6" },
  { label: "0X",  kind: "multiplier", value: 0,  color: "#1e293b" },
  { label: "15X", kind: "multiplier", value: 15, color: "#22c55e" },
  { label: "0X",  kind: "multiplier", value: 0,  color: "#374151" },
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

// Index-based weights matching STANDARD_PRIZES order:
// 0X(22) · 2X(18) · 0X(22) · 8X(7) · 0X(20) · 15X(5) · 0X(4) · 50X(2)
// Total 0X = 68 %, 2X = 18 % → 86 % chance of low/no reward.
const PRIZE_WEIGHTS: number[] = [22, 18, 22, 7, 20, 5, 4, 2];

export function pickWeightedPrizeIndex(prizes: Prize[] = STANDARD_PRIZES): number {
  const weighted = prizes.map((_, i) => PRIZE_WEIGHTS[i] ?? 0);
  const total = weighted.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return 0;
  let roll = Math.random() * total;
  for (let i = 0; i < weighted.length; i++) {
    roll -= Math.max(0, weighted[i]);
    if (roll < 0) return i;
  }
  return weighted.length - 1;
}
