"use client";

import Image from "next/image";
import type { Camera } from "@/types";
import { angleLabel } from "@/hooks/enrollment_Kyc/useEnrollSession";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Angle, NormBBox } from "@/features/enroll/EnrollmentKycSystem";

export function EnrollmentPreviewCard(props: {
  running: boolean;
  noScan: boolean;
  cameraId: string;
  selectedCamera?: Camera;
  aiBase: string;

  faceBox: NormBBox;
  faceCircle: { cx: number; cy: number; radius: number } | null;

  autoScan: boolean;
  kycEnabled: boolean;
  currentAngle: Angle;

  faceReady: boolean;
  overlayInstruction: string;
  activeInstruction: string;
  faceReadyPct: number;

  angleProgress: number;
  need: number;

  doneCount: number;
  progressPct: number;

  kycOk: boolean;
  kycReason: string;

  msg: string;
  err: string;

  arcPct: number;
}) {
  const {
    running,
    noScan,
    cameraId,
    selectedCamera,
    aiBase,
    faceBox,
    faceCircle,
    autoScan,
    kycEnabled,
    currentAngle,
    faceReady,
    overlayInstruction,
    activeInstruction,
    faceReadyPct,
    angleProgress,
    need,
    doneCount,
    progressPct,
    kycOk,
    kycReason,
    msg,
    err,
    arcPct,
  } = props;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Enrollment Preview</CardTitle>
            <CardDescription className="text-sm">
              Portrait preview + face rectangle overlay.
            </CardDescription>
          </div>

          <Badge variant={running ? "default" : "secondary"} className="mt-1">
            {running ? "Running" : "Stopped"}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          {selectedCamera
            ? `${selectedCamera.name} (${selectedCamera.id})`
            : "Select a camera"}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded-xl border bg-muted">
          <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-[9/16] max-h-[70vh] sm:max-h-[520px] md:max-h-[600px]">
            {running && cameraId && !noScan ? (
              <Image
                src={`${aiBase}/camera/stream/${cameraId}`}
                alt="camera"
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 420px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                {noScan ? "No-scan mode enabled" : "Camera OFF"}
              </div>
            )}

            {/* Face rectangle overlay */}
            {running && !noScan && faceBox ? (
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute"
                  style={{
                    left: `${faceBox.x * 100}%`,
                    top: `${faceBox.y * 100}%`,
                    width: `${faceBox.w * 100}%`,
                    height: `${faceBox.h * 100}%`,
                  }}
                >
                  <div className="absolute inset-0 rounded-xl border-2 border-emerald-300/90 shadow-[0_0_30px_rgba(16,185,129,0.35)] animate-[pulse_1.6s_ease-in-out_infinite]" />
                  <div className="absolute -inset-2 rounded-2xl border border-emerald-200/40 blur-lg" />
                </div>
              </div>
            ) : null}

            {/* Circular capture arc */}
            {running && !noScan && faceCircle ? (
              <svg
                className="pointer-events-none absolute inset-0"
                viewBox="0 0 100 100"
                style={{
                  left: `${faceCircle.cx - faceCircle.radius}%`,
                  top: `${faceCircle.cy - faceCircle.radius}%`,
                  width: `${faceCircle.radius * 2}%`,
                  height: `${faceCircle.radius * 2}%`,
                }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="4"
                  strokeDasharray="4 6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={faceReady ? "#22c55e" : "#f97316"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max(3, arcPct * 289)} 289`}
                  strokeDashoffset="72"
                  className={`transition-all duration-400 ${
                    faceReady ? "opacity-100" : "opacity-80"
                  }`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={err ? "#ef4444" : "transparent"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="289"
                  strokeDashoffset="72"
                  className="transition-all duration-300"
                  opacity={err ? 0.9 : 0}
                />
              </svg>
            ) : null}

            {/* Stream overlay */}
            {running && !noScan ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-full bg-black/65 px-3 py-1 text-[11px] uppercase tracking-wide text-white shadow-lg">
                    {autoScan && kycEnabled ? "Auto KYC" : "Manual capture"} -{" "}
                    {angleLabel(currentAngle)}
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold shadow ${
                      faceReady
                        ? "bg-emerald-500/90 text-white animate-pulse"
                        : "bg-amber-400/90 text-black animate-[pulse_1.2s_ease-in-out_infinite]"
                    }`}
                  >
                    {faceReady ? "Face locked" : "Align face"}
                  </div>
                </div>

                <div className="grid w-full grid-cols-[1fr_auto] items-end gap-3 sm:gap-4">
                  <div className="rounded-2xl bg-gradient-to-r from-black/80 via-black/60 to-black/30 px-4 py-3 shadow-xl backdrop-blur-sm">
                    <div className="text-[11px] uppercase tracking-wide text-white/60">
                      Live guidance
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
                      <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-300" />
                      {overlayInstruction} - {angleLabel(currentAngle)}
                    </div>
                    <div className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-white/80">
                      {activeInstruction}
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/20">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          faceReady ? "bg-emerald-400" : "bg-amber-300"
                        }`}
                        style={{
                          width: `${Math.round(faceReadyPct * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/50 text-xs text-white shadow-lg backdrop-blur">
                    <div className="text-center leading-tight">
                      {angleProgress}/{need}
                      <div className="text-[10px] text-white/70">frames</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Angle: </span>
              <span className="font-semibold">{angleLabel(currentAngle)}</span>
              <span className="ml-2 text-muted-foreground">
                ({angleProgress}/{need})
              </span>
            </div>
            <div className="text-muted-foreground">
              <span className="font-semibold text-foreground">{doneCount}</span>{" "}
              / 5 angles
              <span className="ml-2">({progressPct}%)</span>
            </div>
          </div>
          <Progress value={progressPct} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <div className="text-xs text-muted-foreground">KYC status</div>
            <div
              className={`text-sm font-semibold ${
                kycEnabled
                  ? kycOk
                    ? "text-emerald-700"
                    : "text-amber-700"
                  : "text-muted-foreground"
              }`}
            >
              {kycEnabled
                ? kycOk
                  ? "Pass"
                  : kycReason || "In progress"
                : "Disabled"}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 px-3 py-2">
            <div className="text-xs text-muted-foreground">Face readiness</div>
            <div className="text-sm font-semibold text-foreground">
              {faceReady ? "Locked on" : "Align & hold"}
              <span className="ml-1 text-xs text-muted-foreground">
                ({Math.round(faceReadyPct * 100)}% steady)
              </span>
            </div>
          </div>
        </div>

        {msg ? (
          <div className="rounded-lg border bg-background px-3 py-2 text-sm">
            <span className="text-muted-foreground">Info: </span>
            <span className="font-medium">{msg}</span>
          </div>
        ) : null}

        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
