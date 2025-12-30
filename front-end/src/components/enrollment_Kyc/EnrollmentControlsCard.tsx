"use client";

import type { Camera, Employee } from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ToggleSwitch } from "./ToggleSwitch";
import { Angle, ANGLES } from "@/features/enroll/EnrollmentKycSystem";
import { angleLabel, clamp } from "@/hooks/enrollment_Kyc/useEnrollSession";

export function EnrollmentControlsCard(props: {
  cameras: Camera[];
  employees: Employee[];

  running: boolean;
  busy: boolean;

  mode: "new" | "existing";
  cameraId: string;
  noScan: boolean;

  kycEnabled: boolean;
  autoScan: boolean;
  samplesPerAngle: number;

  currentAngle: Angle;
  staged: Record<string, number>;
  need: number;

  canSave: boolean;
  kycOk: boolean;

  name: string;
  employeeId: string;

  setCameraId: (v: string) => void;
  setMode: (v: "new" | "existing") => void;
  setName: (v: string) => void;
  onSelectEmployee: (id: string) => void;

  setNoScan: (fn: (v: boolean) => boolean) => void;
  setKycEnabled: (fn: (v: boolean) => boolean) => void;
  setAutoScan: (fn: (v: boolean) => boolean) => void;
  setSamplesPerAngle: (v: number) => void;

  onChangeAngle: (a: Angle) => void;
  onStartEnroll: () => Promise<void>;
  onStopEnroll: () => Promise<void>;
  onCaptureManual: () => Promise<void>;
  onSaveAll: () => Promise<void>;
  onCancelAll: () => Promise<void>;
  onRescanAngle: () => Promise<void>;
}) {
  const {
    cameras,
    employees,
    running,
    busy,
    mode,
    cameraId,
    noScan,
    kycEnabled,
    autoScan,
    samplesPerAngle,
    currentAngle,
    staged,
    need,
    canSave,
    kycOk,
    name,
    employeeId,
    setCameraId,
    setMode,
    setName,
    onSelectEmployee,
    setNoScan,
    setKycEnabled,
    setAutoScan,
    setSamplesPerAngle,
    onChangeAngle,
    onStartEnroll,
    onStopEnroll,
    onCaptureManual,
    onSaveAll,
    onCancelAll,
    onRescanAngle,
  } = props;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Enrollment Controls</CardTitle>
        <CardDescription className="text-sm">
          Guided auto-scan with paced KYC ticks and AI auto-save.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Top row */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">Camera</Label>
            <Select
              value={cameraId}
              onValueChange={setCameraId}
              disabled={running || busy}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {cameras.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Mode</Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as any)}
              disabled={running || busy}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New employee</SelectItem>
                <SelectItem value="existing">Existing employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {mode === "new" ? (
              <>
                <Label className="text-sm">Employee name</Label>
                <Input
                  className="h-10"
                  placeholder="e.g. Rahim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={running || busy}
                />
              </>
            ) : (
              <>
                <Label className="text-sm">Employee</Label>
                <Select
                  value={employeeId}
                  onValueChange={onSelectEmployee}
                  disabled={running || busy}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* No scan toggle */}
        <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Create without scanning</div>
            <div className="text-xs text-muted-foreground">
              Creates employee record only. Scan later from existing employee.
            </div>
          </div>

          <ToggleSwitch
            checked={noScan}
            disabled={busy || running}
            onChange={() => setNoScan((v) => !v)}
            ariaLabel="Toggle no-scan"
          />
        </div>

        <Separator />

        {/* KYC settings */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">KYC Mode</div>
              <div className="text-xs text-muted-foreground">
                Uses KYC tick + auto save in AI.
              </div>
            </div>

            <ToggleSwitch
              checked={kycEnabled}
              disabled={busy || running}
              onChange={() => setKycEnabled((v) => !v)}
              ariaLabel="Toggle kyc"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Auto Scan</div>
              <div className="text-xs text-muted-foreground">
                Calls /api/enroll/kyc/tick repeatedly.
              </div>
            </div>

            <ToggleSwitch
              checked={autoScan}
              disabled={busy || noScan || !kycEnabled}
              onChange={() => setAutoScan((v) => !v)}
              ariaLabel="Toggle autoscan"
              title={!kycEnabled ? "Enable KYC to use Auto Scan" : ""}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm">Samples per angle</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={10}
                value={samplesPerAngle}
                onChange={(e) =>
                  setSamplesPerAngle(clamp(Number(e.target.value || 3), 1, 10))
                }
                disabled={running || busy || noScan}
                className="h-10 w-32"
              />
              <div className="text-xs text-muted-foreground">
                Recommended 3–5.
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Angles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Angles</Label>
            <div className="text-xs text-muted-foreground">
              Need: {need}/angle
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ANGLES.map((a: any) => {
              const captured = (staged[a] ?? 0) >= need;
              const active = currentAngle === a;

              return (
                <Button
                  key={a}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="h-9"
                  onClick={() => onChangeAngle(a)}
                  disabled={!running || busy || noScan || autoScan}
                  title={
                    captured
                      ? `Done (${staged[a]}/${need})`
                      : `${staged[a] ?? 0}/${need}`
                  }
                >
                  {angleLabel(a)}{" "}
                  {captured ? <span className="ml-1">✅</span> : null}
                </Button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={onRescanAngle}
              disabled={!running || busy || noScan}
            >
              Re-scan this angle
            </Button>
            <div className="text-xs text-muted-foreground self-center">
              Clears only <b>{angleLabel(currentAngle)}</b>.
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onStartEnroll}
            disabled={busy || running}
            className="h-10"
          >
            Start Enroll
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onCaptureManual}
            disabled={busy || !running || noScan || autoScan}
            className="h-10"
            title={autoScan ? "Disable Auto Scan to use manual capture" : ""}
          >
            Capture (manual)
          </Button>

          <Button
            type="button"
            onClick={onSaveAll}
            disabled={
              busy ||
              !running ||
              noScan ||
              autoScan ||
              !canSave ||
              (kycEnabled && !kycOk)
            }
            className="h-10"
            title={
              autoScan
                ? "Auto Scan uses AI auto-save"
                : kycEnabled && !kycOk
                ? "KYC must pass to save"
                : ""
            }
          >
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancelAll}
            disabled={busy || !running || noScan}
            className="h-10"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={onStopEnroll}
            disabled={busy || !running}
            className="h-10"
          >
            Stop
          </Button>
        </div>

        <div className="text-xs text-muted-foreground leading-relaxed">
          <b>Auto Scan:</b> uses <code>/api/enroll/kyc/tick</code> and AI will
          save automatically when complete. The overlay is a{" "}
          <b>face circle with progress arc</b>; align and hold your face steady
          to fill the arc. <br />
          <b>Manual Capture:</b> for each angle, align your face within the
          rectangle and move closer until the circle appears.
        </div>
      </CardContent>
    </Card>
  );
}
