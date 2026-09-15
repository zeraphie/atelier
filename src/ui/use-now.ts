import { useEffect, useState } from "react";

// Often enough for "just now" to become "a minute ago" on time.
const TICK_MS = 30_000;

/** The time, as a value that moves on every half minute, so a component can say how long ago. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      clearInterval(ticker);
    };
  }, []);
  return now;
}
