"use client";

import { useCallback, useEffect, useRef } from "react";

export function useAutoScanLoop(args: {
  enabled: boolean;
  intervalMs: number;
  tick: () => Promise<void> | void;
}) {
  const { enabled, intervalMs, tick } = args;
  const timerRef = useRef<number | null>(null);

  const startAutoLoop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => tick(), intervalMs);
  }, [intervalMs, tick]);

  const stopAutoLoop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) startAutoLoop();
    else stopAutoLoop();
    return () => stopAutoLoop();
  }, [enabled, startAutoLoop, stopAutoLoop]);

  return { startAutoLoop, stopAutoLoop };
}
