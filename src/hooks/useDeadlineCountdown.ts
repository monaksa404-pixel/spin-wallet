import { useEffect, useMemo, useState } from "react";

/** Live countdown until `deadlineIso`; returns null if no deadline or already passed (client clock). */
export function useDeadlineCountdown(deadlineIso: string | null | undefined) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!deadlineIso) return;
    const end = new Date(deadlineIso).getTime();
    if (Number.isNaN(end) || end <= Date.now()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [deadlineIso]);

  return useMemo(() => {
    if (!deadlineIso) return null;
    const end = new Date(deadlineIso).getTime();
    if (Number.isNaN(end)) return null;
    const ms = end - Date.now();
    if (ms <= 0) return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, label: "00:00:00" };
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    const seconds = Math.floor((ms % 60_000) / 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      totalMs: ms,
      hours,
      minutes,
      seconds,
      label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    };
  }, [deadlineIso, tick]);
}
