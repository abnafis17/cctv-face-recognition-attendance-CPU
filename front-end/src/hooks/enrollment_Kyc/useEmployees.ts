"use client";

import { useCallback, useState } from "react";
import { fetchJSON } from "@/lib/api";
import { Employee } from "@/types";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadEmployees = useCallback(async () => {
    const emps = await fetchJSON<Employee[]>("/employees");
    setEmployees(emps);
    return emps;
  }, []);

  return { employees, setEmployees, loadEmployees };
}
