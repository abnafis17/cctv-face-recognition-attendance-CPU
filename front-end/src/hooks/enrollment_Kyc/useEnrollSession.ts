"use client";

import { useCallback } from "react";
import { fetchJSON } from "@/lib/api";
import { Angle, ANGLES, NormBBox } from "@/features/enroll/EnrollmentKycSystem";

export function angleLabel(a: Angle) {
  return a.charAt(0).toUpperCase() + a.slice(1);
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function instructionForAngle(a: Angle) {
  if (a === "front") return "Hold your face in front";
  if (a === "left") return "Turn left";
  if (a === "right") return "Turn right";
  if (a === "up") return "Look up";
  return "Look down";
}

export function useEnrollSession(args: {
  setRunning: (v: boolean) => void;
  setCurrentAngle: (a: Angle) => void;
  setMsg: (m: string) => void;
  setKycOk: (v: boolean) => void;
  setKycReason: (v: string) => void;
  setFaceBox: (b: NormBBox) => void;
  setStaged: (
    fn: (prev: Record<string, number>) => Record<string, number>
  ) => void;
  updateFaceStability: (b: NormBBox) => void;
  resetFaceStability: () => void;
}) {
  const {
    setRunning,
    setCurrentAngle,
    setMsg,
    setKycOk,
    setKycReason,
    setFaceBox,
    setStaged,
    updateFaceStability,
    resetFaceStability,
  } = args;

  const applyServerSession = useCallback(
    (s: any) => {
      setRunning(s?.status === "running");

      if (s?.current_angle) setCurrentAngle(s.current_angle as Angle);
      if (typeof s?.last_message === "string") setMsg(s.last_message);

      // KYC fields from AI session
      if (typeof s?.kyc_ok === "boolean") setKycOk(!!s.kyc_ok);
      if (typeof s?.kyc_reason === "string") setKycReason(s.kyc_reason || "");

      // normalized bbox for rectangle overlay
      if (s?.last_bbox && typeof s.last_bbox === "object") {
        const b = s.last_bbox;
        if (
          typeof b.x === "number" &&
          typeof b.y === "number" &&
          typeof b.w === "number" &&
          typeof b.h === "number"
        ) {
          const normalized = {
            x: clamp(b.x, 0, 1),
            y: clamp(b.y, 0, 1),
            w: clamp(b.w, 0, 1),
            h: clamp(b.h, 0, 1),
          };
          setFaceBox(normalized);
          updateFaceStability(normalized);
        } else {
          updateFaceStability(null);
          setFaceBox(null);
        }
      } else {
        updateFaceStability(null);
        setFaceBox(null);
      }

      // collected counts
      const serverCollected: Record<string, number> = s?.collected || {};
      if (serverCollected && typeof serverCollected === "object") {
        setStaged((prev) => {
          const next = { ...prev };
          for (const a of ANGLES) {
            const pv = prev[a] ?? 0;
            const sv = Number(serverCollected[a] ?? 0);
            next[a] = Math.max(pv, sv);
          }
          return next;
        });
      }
    },
    [
      setRunning,
      setCurrentAngle,
      setMsg,
      setKycOk,
      setKycReason,
      setFaceBox,
      setStaged,
      updateFaceStability,
    ]
  );

  const refreshStatus = useCallback(async () => {
    const data = await fetchJSON<any>("/enroll/status");
    const s = data?.session;
    if (!s) {
      setRunning(false);
      resetFaceStability();
      return;
    }
    applyServerSession(s);
  }, [applyServerSession, setRunning, resetFaceStability]);

  return { applyServerSession, refreshStatus };
}
