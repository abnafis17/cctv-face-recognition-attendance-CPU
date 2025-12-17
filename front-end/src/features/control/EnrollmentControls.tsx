"use client";

import { useEffect, useState } from "react";
import { fetchJSON, postJSON } from "@/lib/api";
import { Camera, Employee } from "@/types";

export default function EnrollmentControls({ cameras }: { cameras: Camera[] }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cameraId, setCameraId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");

  async function loadEmployees() {
    const emps = await fetchJSON<Employee[]>("/api/employees");
    setEmployees(emps);
  }

  async function refreshStatus() {
    const s = await fetchJSON<{ running: boolean }>("/api/enroll/status");
    setRunning(!!s.running);
  }

  async function startEnroll() {
    try {
      setErr("");
      await postJSON("/api/enroll/start", {
        name,
        employeeId: employeeId || null,
        cameraId,
      });
      refreshStatus();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to start enroll");
    }
  }

  async function stopEnroll() {
    await postJSON("/api/enroll/stop");
    refreshStatus();
  }

  useEffect(() => {
    loadEmployees();
    refreshStatus();
    const t = setInterval(refreshStatus, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Enrollment</div>
          <div className="text-sm text-gray-500">
            Status: {running ? "Running (AI machine)" : "Stopped"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={startEnroll}
          >
            Start Enroll
          </button>
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={stopEnroll}
          >
            Stop Enroll
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <div className="text-xs text-gray-500">Camera</div>
          <select
            className="mt-1 w-full rounded-md border px-2 py-2"
            value={cameraId}
            onChange={(e) => setCameraId(e.target.value)}
          >
            <option value="">Select camera</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-gray-500">Employee (existing)</div>
          <select
            className="mt-1 w-full rounded-md border px-2 py-2"
            value={employeeId}
            onChange={(e) => {
              const v = e.target.value;
              setEmployeeId(v);
              const emp = employees.find((x) => x.id === v);
              if (emp) setName(emp.name);
            }}
          >
            <option value="">(Optional) Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-gray-500">Name (required)</div>
          <input
            className="mt-1 w-full rounded-md border px-2 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Employee name"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Note: Enrollment starts your existing AI enroll script on the AI
        machine. If it uses a preview window (OpenCV), that window will appear
        on the AI machine.
      </p>
    </div>
  );
}
