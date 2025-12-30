"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { postJSON } from "@/lib/api";
import { Camera, Employee } from "@/types";
import { useEmployees } from "@/hooks/enrollment_Kyc/useEmployees";
import { useAudioGuidance } from "@/hooks/enrollment_Kyc/useAudioGuidance";
import { useFaceStability } from "@/hooks/enrollment_Kyc/useFaceStability";
import {
  angleLabel,
  clamp,
  instructionForAngle,
  useEnrollSession,
} from "@/hooks/enrollment_Kyc/useEnrollSession";
import { useAutoScanLoop } from "@/hooks/enrollment_Kyc/useAutoScanLoop";
import { EnrollmentPreviewCard } from "@/components/enrollment_Kyc/EnrollmentPreviewCard";
import { EnrollmentControlsCard } from "@/components/enrollment_Kyc/EnrollmentControlsCard";

export type Angle = "front" | "left" | "right" | "up" | "down";
export const ANGLES: Angle[] = ["front", "left", "right", "up", "down"];

export type NormBBox = { x: number; y: number; w: number; h: number } | null;

const MIN_STABLE_MS = 800; // minimum time the face must stay steady before ticking
const MIN_TICK_GAP_MS = 1100; // throttle auto-tick calls to avoid over-driving backend
const MIN_FACE_AREA = 0.03; // normalized area threshold to ensure the face fills the frame

export default function EnrollmentKycSystem({
  cameras,
}: {
  cameras: Camera[];
}) {
  const [cameraId, setCameraId] = useState("");

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [noScan, setNoScan] = useState(false);

  const [running, setRunning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState<Angle>("front");

  // KYC / autoscan UI
  const [kycEnabled, setKycEnabled] = useState(true);
  const [autoScan, setAutoScan] = useState(true);
  const [samplesPerAngle, setSamplesPerAngle] = useState<number>(3);

  const [kycOk, setKycOk] = useState(false);
  const [kycReason, setKycReason] = useState<string>("");

  // face rectangle overlay (normalized)
  const [faceBox, setFaceBox] = useState<NormBBox>(null);

  // local staged is source-of-truth for progress UI
  const [staged, setStaged] = useState<Record<string, number>>({});
  const stagedRef = useRef<Record<string, number>>({});
  useEffect(() => {
    stagedRef.current = staged;
  }, [staged]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [captureFlash, setCaptureFlash] = useState<{
    angle: Angle;
    at: number;
  } | null>(null);

  // === hooks ===
  const { employees, loadEmployees } = useEmployees();
  const { playTone, speak, lastSpokenRef } = useAudioGuidance();

  // ✅ updated hook (no ref reads during render)
  const {
    faceReady,
    faceReadyPct,
    faceReadyAnnouncedRef,
    updateFaceStability,
    resetFaceStability,
  } = useFaceStability({
    minStableMs: MIN_STABLE_MS,
    minFaceArea: MIN_FACE_AREA,
  });

  const aiBase = process.env.NEXT_PUBLIC_AI_URL || "http://127.0.0.1:8000";

  const selectedCamera = useMemo(
    () => cameras.find((c) => c.id === cameraId),
    [cameras, cameraId]
  );

  const need = useMemo(() => clamp(samplesPerAngle, 1, 10), [samplesPerAngle]);

  const doneCount = useMemo(() => {
    return ANGLES.filter((a) => (staged?.[a] ?? 0) >= need).length;
  }, [staged, need]);

  const progressPct = useMemo(() => {
    return Math.round((doneCount / ANGLES.length) * 100);
  }, [doneCount]);

  const canSave = useMemo(() => {
    return Object.values(staged || {}).some((v) => (v ?? 0) > 0);
  }, [staged]);

  // session applier + refresh
  const { applyServerSession, refreshStatus } = useEnrollSession({
    setRunning,
    setCurrentAngle,
    setMsg,
    setKycOk,
    setKycReason,
    setFaceBox,
    setStaged,
    updateFaceStability,
    resetFaceStability,
  });

  // Face ready announcement
  useEffect(() => {
    if (faceReady && running && !noScan && !faceReadyAnnouncedRef.current) {
      faceReadyAnnouncedRef.current = true;
      playTone(880, 0.1);
      speak("Face locked. Hold steady while we capture.");
    }
    if (!faceReady) faceReadyAnnouncedRef.current = false;
  }, [faceReady, running, noScan, playTone, speak, faceReadyAnnouncedRef]);

  // ---- actions (kept same logic) ----
  async function startEnroll() {
    try {
      setErr("");
      setBusy(true);

      if (!noScan && !cameraId) throw new Error("Select a camera");
      if (mode === "new" && !name.trim())
        throw new Error("Enter employee name");
      if (mode === "existing" && !employeeId)
        throw new Error("Select employee");

      if (!noScan) {
        await postJSON(`/cameras/${cameraId}/start`);
      }

      await postJSON("/enroll/start", {
        cameraId,
        name: mode === "new" ? name.trim() : undefined,
        employeeId: mode === "existing" ? employeeId : undefined,
        allowNoScan: noScan,
        kycEnabled,
        samplesPerAngle: clamp(samplesPerAngle, 1, 10),
      });

      if (noScan) {
        toast.success("Employee created (no scan).");
        await loadEmployees();
        setMsg(
          "Employee created without scanning. Select existing employee later to scan."
        );
        return;
      }

      toast.success("Enrollment started");

      // reset UI
      setStaged({});
      setFaceBox(null);
      setKycOk(false);
      setKycReason("");
      setCurrentAngle("front");
      lastSpokenRef.current = "";
      resetFaceStability();

      await loadEmployees();
      await refreshStatus();

      speak(instructionForAngle("front"));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to start enroll");
      toast.error("Start failed");
    } finally {
      setBusy(false);
    }
  }

  async function stopEnroll() {
    try {
      setErr("");
      setBusy(true);

      await postJSON("/enroll/stop");
      if (cameraId) await postJSON(`/cameras/${cameraId}/stop`);

      setRunning(false);
      setStaged({});
      setFaceBox(null);
      setMsg("");
      resetFaceStability();
      setErr("");
      setCurrentAngle("front");
      setKycOk(false);
      setKycReason("");

      toast("Enrollment stopped", { icon: "🛑" });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to stop");
      toast.error("Stop failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeAngle(a: Angle) {
    try {
      setErr("");
      setBusy(true);
      await postJSON("/enroll/angle", { angle: a });
      setCurrentAngle(a);
      speak(instructionForAngle(a));
      await refreshStatus();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to change angle");
      toast.error("Angle change failed");
    } finally {
      setBusy(false);
    }
  }

  async function captureManual() {
    try {
      setErr("");
      setBusy(true);

      const resp = await postJSON<any>("/enroll/capture", {
        angle: currentAngle,
      });

      if (!resp?.ok || !resp?.result?.ok) {
        const m =
          resp?.result?.error ||
          resp?.error ||
          resp?.session?.last_message ||
          "Capture failed";
        setErr(m);
        setMsg(m);
        toast.error(m);
        await refreshStatus();
        return;
      }

      toast.success(`Captured: ${currentAngle}`);
      if (resp?.session) applyServerSession(resp.session);
      else await refreshStatus();
    } catch (e: any) {
      const m = e?.message ?? "Capture failed";
      setErr(m);
      toast.error(m);
    } finally {
      setBusy(false);
    }
  }

  async function saveAll() {
    try {
      setErr("");
      setBusy(true);

      if (!canSave) {
        toast.error("Capture at least 1 angle to enable Save", { icon: "ℹ️" });
        return;
      }

      const out = await postJSON<any>("/enroll/save");
      const saved: string[] = out?.result?.saved_angles || [];

      if (saved.length > 0) toast.success(`Saved: ${saved.join(", ")}`);
      else toast("Nothing saved", { icon: "ℹ️" });

      await postJSON("/enroll/stop");
      if (cameraId) await postJSON(`/cameras/${cameraId}/stop`);

      setRunning(false);
      setStaged({});
      setFaceBox(null);
      setMsg("");
      resetFaceStability();
      setCurrentAngle("front");
      setKycOk(false);
      setKycReason("");

      await refreshStatus();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save enrollment");
      toast.error("Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancelAll() {
    try {
      setErr("");
      setBusy(true);

      await postJSON("/enroll/cancel");

      // ✅ local reset to match server hard reset (front + clear box)
      setStaged({});
      setFaceBox(null);
      setCurrentAngle("front");
      setKycOk(false);
      setKycReason("canceled");
      setMsg("Canceled. Restart scanning from Front.");
      lastSpokenRef.current = "";
      resetFaceStability();

      toast("Canceled staged captures", { icon: "↩️" });

      await refreshStatus();
      speak(instructionForAngle("front"));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to cancel");
      toast.error("Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  async function rescanCurrentAngle() {
    try {
      setErr("");
      setBusy(true);

      await postJSON("/enroll/clear-angle", { angle: currentAngle });
      setStaged((prev) => ({ ...prev, [currentAngle]: 0 }));
      resetFaceStability();

      toast(`Cleared ${angleLabel(currentAngle)}. Capture again.`, {
        icon: "🧹",
      });
      await refreshStatus();
      speak(instructionForAngle(currentAngle));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to clear angle");
      toast.error("Re-scan failed");
    } finally {
      setBusy(false);
    }
  }

  // ---- Auto scan loop ----
  const liveRef = useRef({
    running: false,
    noScan: false,
    autoScan: true,
    kycEnabled: true,
    busy: false,
    currentAngle: "front" as Angle,
    cameraId: "",
    faceReady: false,
  });

  useEffect(() => {
    liveRef.current.running = running;
    liveRef.current.noScan = noScan;
    liveRef.current.autoScan = autoScan;
    liveRef.current.kycEnabled = kycEnabled;
    liveRef.current.busy = busy;
    liveRef.current.currentAngle = currentAngle;
    liveRef.current.cameraId = cameraId;
    liveRef.current.faceReady = faceReady;
  }, [
    running,
    noScan,
    autoScan,
    kycEnabled,
    busy,
    currentAngle,
    cameraId,
    faceReady,
  ]);

  const lastTickAtRef = useRef<number>(0);
  const tickInFlightRef = useRef(false);

  const { startAutoLoop, stopAutoLoop } = useAutoScanLoop({
    enabled: running && autoScan && kycEnabled && !noScan,
    intervalMs: 250,
    tick: async () => {
      const live = liveRef.current;

      // Gate before request (avoid useless network calls)
      if (!live.running || live.noScan || !live.autoScan) return;
      if (!live.kycEnabled) return;
      if (live.busy) return;
      if (tickInFlightRef.current) return;

      const now = Date.now();
      if (now - lastTickAtRef.current < MIN_TICK_GAP_MS) return;
      lastTickAtRef.current = now;

      try {
        tickInFlightRef.current = true;

        const resp = await postJSON<any>("/enroll/kyc/tick");
        const out = resp?.result;

        // ✅ if server returned a session, always apply it (even when error/throttled)
        const prevAngle = liveRef.current.currentAngle;
        if (resp?.session) {
          applyServerSession(resp.session);

          const nextAngle = resp.session?.current_angle as Angle | undefined;
          if (nextAngle && nextAngle !== prevAngle) {
            speak(instructionForAngle(nextAngle));
          }
        }

        // ✅ now validate outer+inner ok
        if (!resp?.ok || !out?.ok) {
          const m =
            out?.error ||
            resp?.error ||
            resp?.session?.last_message ||
            "KYC tick failed";
          setErr(m);
          setMsg(m);
          return;
        }

        // Throttled is normal; surface reason so operator sees it
        if (out?.throttled) {
          if (out?.reason) setMsg(out.reason);
          return;
        }

        // if session missing (rare), fallback refresh
        if (!resp?.session) {
          await refreshStatus();
        }

        // ✅ completion check
        const s = resp?.session;
        const stage = String(s?.kyc_stage || "");
        const passed = !!s?.kyc_ok;

        if (stage === "done" && passed) {
          toast.success("KYC passed & saved ✅");
          speak("Verification complete.");

          await postJSON("/enroll/stop");

          const camToStop = liveRef.current.cameraId;
          if (camToStop) await postJSON(`/cameras/${camToStop}/stop`);

          setRunning(false);
          setStaged({});
          setFaceBox(null);
          setMsg("KYC passed & saved");
          setCurrentAngle("front");
          setKycOk(false);
          setKycReason("");
        }
      } finally {
        tickInFlightRef.current = false;
      }
    },
  });

  // Poll status
  useEffect(() => {
    loadEmployees();
    refreshStatus();

    const t = window.setInterval(() => {
      if (running) refreshStatus();
    }, 1500);

    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Auto loop lifecycle
  useEffect(() => {
    if (running && autoScan && kycEnabled && !noScan) startAutoLoop();
    else stopAutoLoop();
    return () => stopAutoLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, autoScan, kycEnabled, noScan]);

  // Per-angle progress
  const angleProgress = useMemo(() => {
    const v = staged[currentAngle] ?? 0;
    return clamp(v, 0, need);
  }, [staged, currentAngle, need]);

  const activeInstruction = useMemo(
    () => instructionForAngle(currentAngle),
    [currentAngle]
  );

  const overlayInstruction = useMemo(() => {
    if (!running || noScan) return "Start enrollment to view guidance.";
    if (!faceBox) return "Face not detected. Center your face in the frame.";
    if (faceReady) return "Hold steady - capturing";
    const pct = Math.round(faceReadyPct * 100);
    return `Align your face and stay still (${pct}% steady)`;
  }, [running, noScan, faceBox, faceReady, faceReadyPct]);

  const currentCount = staged[currentAngle] ?? 0;
  const arcPct = useMemo(
    () => clamp(currentCount / need, 0, 1),
    [currentCount, need]
  );

  const faceCircle = useMemo(() => {
    if (!faceBox) return null;
    const radius = Math.max(12, (Math.min(faceBox.w, faceBox.h) * 100) / 2.2);
    const cx = faceBox.x * 100 + (faceBox.w * 100) / 2;
    const cy = faceBox.y * 100 + (faceBox.h * 100) / 2;
    return { cx, cy, radius };
  }, [faceBox]);

  useEffect(() => {
    // Flash when a count increases for the active angle
    const prev = captureFlash?.angle;
    if (currentCount > 0) {
      setCaptureFlash({ angle: currentAngle, at: Date.now() });
    } else if (prev && currentAngle !== prev) {
      setCaptureFlash(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCount]);

  // keep the exact selection behavior you had
  function onSelectEmployee(id: string) {
    setEmployeeId(id);
    const emp = employees.find((x: Employee) => x.id === id);
    if (emp) setName(emp.name);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <EnrollmentPreviewCard
        running={running}
        noScan={noScan}
        cameraId={cameraId}
        selectedCamera={selectedCamera}
        aiBase={aiBase}
        faceBox={faceBox}
        faceCircle={faceCircle}
        autoScan={autoScan}
        kycEnabled={kycEnabled}
        currentAngle={currentAngle}
        faceReady={faceReady}
        overlayInstruction={overlayInstruction}
        activeInstruction={activeInstruction}
        faceReadyPct={faceReadyPct}
        angleProgress={angleProgress}
        need={need}
        doneCount={doneCount}
        progressPct={progressPct}
        kycOk={kycOk}
        kycReason={kycReason}
        msg={msg}
        err={err}
        arcPct={arcPct}
      />

      <EnrollmentControlsCard
        cameras={cameras}
        employees={employees}
        running={running}
        busy={busy}
        mode={mode}
        cameraId={cameraId}
        noScan={noScan}
        kycEnabled={kycEnabled}
        autoScan={autoScan}
        samplesPerAngle={samplesPerAngle}
        currentAngle={currentAngle}
        staged={staged}
        need={need}
        canSave={canSave}
        kycOk={kycOk}
        setCameraId={setCameraId}
        setMode={setMode}
        setName={setName}
        name={name}
        employeeId={employeeId}
        onSelectEmployee={onSelectEmployee}
        setNoScan={setNoScan}
        setKycEnabled={setKycEnabled}
        setAutoScan={setAutoScan}
        setSamplesPerAngle={setSamplesPerAngle}
        onChangeAngle={changeAngle}
        onStartEnroll={startEnroll}
        onStopEnroll={stopEnroll}
        onCaptureManual={captureManual}
        onSaveAll={saveAll}
        onCancelAll={cancelAll}
        onRescanAngle={rescanCurrentAngle}
      />
    </div>
  );
}
