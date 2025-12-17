"use client";

import { useEffect, useState } from "react";
import { fetchJSON, postJSON } from "@/lib/api";

export default function AttendanceControls() {
  const [running, setRunning] = useState(false);

  async function refresh() {
    const s = await fetchJSON<{ running: boolean }>(
      "/api/attendance-control/status"
    );
    setRunning(!!s.running);
  }

  async function start() {
    await postJSON("/api/attendance-control/start");
    refresh();
  }

  async function stop() {
    await postJSON("/api/attendance-control/stop");
    refresh();
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Attendance Scanning</div>
          <div className="text-sm text-gray-500">
            Status: {running ? "Running" : "Stopped"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={start}
          >
            Start
          </button>
          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={stop}
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
