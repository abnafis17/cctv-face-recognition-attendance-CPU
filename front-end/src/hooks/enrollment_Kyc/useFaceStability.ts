"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { NormBBox } from "@/features/enroll/EnrollmentKycSystem";

export function useFaceStability(params: {
  minStableMs: number;
  minFaceArea: number;
}) {
  const { minStableMs, minFaceArea } = params;

  const [faceSteadyMs, setFaceSteadyMs] = useState(0);

  // ✅ render-safe: store last box in state (React tracks it)
  const [lastFaceBox, setLastFaceBox] = useState<NormBBox>(null);

  // ✅ refs only for non-render bookkeeping
  const stableSinceRef = useRef<number | null>(null);
  const faceReadyAnnouncedRef = useRef(false);

  const updateFaceStability = useCallback(
    (box: NormBBox) => {
      const now = Date.now();

      // Always update the last box for UI/render logic
      setLastFaceBox(box);

      // if no face or too small -> reset stability
      if (!box || box.w * box.h < minFaceArea) {
        stableSinceRef.current = null;
        setFaceSteadyMs(0);
        faceReadyAnnouncedRef.current = false;
        return;
      }

      // Compare with previous (use functional state to safely read prev)
      setLastFaceBox((prev) => {
        const last = prev;

        const delta =
          last === null
            ? Number.POSITIVE_INFINITY
            : Math.abs(box.x - last.x) +
              Math.abs(box.y - last.y) +
              Math.abs(box.w - last.w) +
              Math.abs(box.h - last.h);

        const movedTooMuch = delta > 0.06;

        if (!last || movedTooMuch) {
          stableSinceRef.current = now;
          setFaceSteadyMs(0);
        } else if (stableSinceRef.current) {
          setFaceSteadyMs(now - stableSinceRef.current);
        } else {
          stableSinceRef.current = now;
          setFaceSteadyMs(0);
        }

        return box; // keep latest as the "prev" for next update
      });
    },
    [minFaceArea]
  );

  // keep steady counter updating like your original
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (stableSinceRef.current) {
        setFaceSteadyMs(Date.now() - stableSinceRef.current);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  const faceReadyPct = useMemo(() => {
    const v = faceSteadyMs / minStableMs;
    return Math.max(0, Math.min(1, v));
  }, [faceSteadyMs, minStableMs]);

  // ✅ no ref read during render anymore
  const faceReady = useMemo(() => {
    if (!lastFaceBox) return false;
    const area = lastFaceBox.w * lastFaceBox.h;
    return area >= minFaceArea && faceSteadyMs >= minStableMs;
  }, [lastFaceBox, faceSteadyMs, minStableMs, minFaceArea]);

  const resetFaceStability = useCallback(() => {
    setFaceSteadyMs(0);
    setLastFaceBox(null);
    stableSinceRef.current = null;
    faceReadyAnnouncedRef.current = false;
  }, []);

  return {
    faceSteadyMs,
    faceReady,
    faceReadyPct,

    // expose render-safe last box (optional)
    lastFaceBox,

    // keep refs exposed if your parent uses them
    stableSinceRef,
    faceReadyAnnouncedRef,

    updateFaceStability,
    resetFaceStability,
  };
}
