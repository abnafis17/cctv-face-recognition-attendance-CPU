"use client";

import { useEffect, useState } from "react";
import { fetchJSON, postJSON } from "@/lib/api";
import type { Camera, Employee } from "@/types";

type EnrollSession = {
  session_id: string;
  employee_id: string;
  name: string;
  camera_id: string;
  status: "running" | "done" | "error" | "stopped";
  error?: string | null;
  angle_index: number;
  collected: Record<string, number>;
  last_quality: number;
  last_pose?: string | null;
};

export default function EnrollPage() {
  const [cams, setCams] = useState<Camera[]>([]);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [session, setSession] = useState<EnrollSession | null>(null);

  const aiBase = process.env.NEXT_PUBLIC_AI_URL || "http://127.0.0.1:8000";

  async function loadBase() {
    setCams(await fetchJSON<Camera[]>("/api/cameras"));
    setEmps(await fetchJSON<Employee[]>("/api/employees"));
  }

  async function refresh() {
    const s = await fetchJSON<{ session: EnrollSession | null }>(
      "/api/enroll-session/status"
    );
    setSession(s.session ?? null);
  }

  useEffect(() => {
    loadBase();
    refresh();
    const t = setInterval(refresh, 1500);
    return () => clearInterval(t);
  }, []);

  async function start() {
    await postJSON("/api/enroll-session/start", {
      employeeId,
      name,
      cameraId,
    });
    refresh();
  }

  async function stop() {
    await postJSON("/api/enroll-session/stop");
    refresh();
  }

  const streamUrl = cameraId ? `${aiBase}/camera/stream/${cameraId}` : "";

  return (
    <div>
      <h1 className="text-2xl font-bold">Enrollment</h1>
      <p className="mt-1 text-sm text-gray-500">
        Scan face from browser (no local window)
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs text-gray-500">Camera</div>
              <select
                className="mt-1 w-full rounded-md border px-2 py-2"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
              >
                <option value="">Select camera</option>
                {cams.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs text-gray-500">Employee (select)</div>
              <select
                className="mt-1 w-full rounded-md border px-2 py-2"
                value={employeeId}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmployeeId(v);
                  const emp = emps.find((x) => x.id === v);
                  if (emp) setName(emp.name);
                }}
              >
                <option value="">Select employee</option>
                {emps.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs text-gray-500">
                Name (auto / editable)
              </div>
              <input
                className="mt-1 w-full rounded-md border px-2 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Employee name"
              />
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={start}
              >
                Start Enrollment
              </button>
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={stop}
              >
                Stop
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-sm">
            <div className="font-semibold">Status</div>
            {session ? (
              <div className="mt-2 space-y-1 text-xs text-gray-700">
                <div>
                  State: <b>{session.status}</b>
                </div>
                <div>
                  Employee: {session.name} ({session.employee_id})
                </div>
                <div>Camera: {session.camera_id}</div>
                <div>
                  Pose: {session.last_pose ?? "N/A"} | Quality:{" "}
                  {session.last_quality.toFixed(1)}
                </div>
                <div>Collected: {JSON.stringify(session.collected)}</div>
                {session.error ? (
                  <div className="text-red-600">Error: {session.error}</div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-600">
                No session running
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="font-semibold">Enrollment Camera View</div>
          <div className="mt-3 overflow-hidden rounded-lg border bg-gray-100">
            {cameraId ? (
              <img src={streamUrl} className="h-96 w-full object-cover" />
            ) : (
              <div className="flex h-96 items-center justify-center text-sm text-gray-600">
                Select a camera to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
