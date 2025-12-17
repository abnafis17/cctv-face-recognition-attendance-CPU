"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/api";
import { AttendanceRow, Employee } from "@/types";

import AppShell from "@/components/layout/AppShell";
import ErrorBox from "@/components/ui/ErrorBox";
import EmployeesList from "@/features/employees/EmployeesList";
import AttendanceList from "@/features/attendance/AttendanceList";

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setErr("");
      const [emps, att] = await Promise.all([
        fetchJSON<Employee[]>("/api/employees"),
        fetchJSON<AttendanceRow[]>("/api/attendance"),
      ]);
      setEmployees(emps);
      setAttendance(att);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppShell>
      {err ? <ErrorBox message={err} /> : null}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <EmployeesList employees={employees} />
        <AttendanceList attendance={attendance} />
      </div>
    </AppShell>
  );
}
