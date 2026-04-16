"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance, { API } from "@/config/axiosInstance";
import ReusableModal from "../../reusable/ReusableModal";
import type {
  CameraAuthorizedEmployeeOption,
  CameraAuthorizedEmployeesState,
  CameraRow,
} from "./types";

function normalizeApiError(error: unknown, fallback: string): string {
  const anyError = error as any;
  return (
    anyError?.response?.data?.error ||
    anyError?.response?.data?.message ||
    anyError?.message ||
    fallback
  );
}

function toSortedDistinctIds(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const id = String(raw ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}

function searchMatchesEmployee(
  employee: CameraAuthorizedEmployeeOption,
  query: string,
): boolean {
  const q = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;

  const haystack = [
    employee.name,
    employee.empId ?? "",
    employee.publicId,
    employee.unit ?? "",
    employee.section ?? "",
    employee.department ?? "",
    employee.line ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

type CameraAuthorizedEmployeesModalProps = {
  open: boolean;
  camera: CameraRow | null;
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
};

export default function CameraAuthorizedEmployeesModal({
  open,
  camera,
  onClose,
  onSaved,
}: CameraAuthorizedEmployeesModalProps) {
  const cameraId = String(camera?.id ?? "").trim();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [state, setState] = useState<CameraAuthorizedEmployeesState | null>(
    null,
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const fetchState = useCallback(async () => {
    if (!cameraId) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get<CameraAuthorizedEmployeesState>(
        `${API.CAMERAS}/${cameraId}/authorized-employees`,
      );

      const nextState = response.data;
      setState(nextState);

      const selectedFromList = Array.isArray(nextState.employees)
        ? nextState.employees
            .filter((employee) => employee.selected)
            .map((employee) => employee.id)
        : [];
      const selected = toSortedDistinctIds(selectedFromList);

      setSelectedEmployeeIds(selected);
      setSearch("");
    } catch (error: unknown) {
      toast.error(
        normalizeApiError(error, "Failed to load authorized employees"),
      );
      setState(null);
      setSelectedEmployeeIds([]);
    } finally {
      setLoading(false);
    }
  }, [cameraId]);

  useEffect(() => {
    if (!open || !cameraId) return;
    void fetchState();
  }, [open, cameraId, fetchState]);

  const employees = useMemo(
    () => (Array.isArray(state?.employees) ? state.employees : []),
    [state],
  );

  const selectedSet = useMemo(
    () => new Set(selectedEmployeeIds),
    [selectedEmployeeIds],
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) => searchMatchesEmployee(employee, search)),
    [employees, search],
  );

  const visibleEmployeeIds = useMemo(
    () => filteredEmployees.map((employee) => employee.id),
    [filteredEmployees],
  );

  const allVisibleSelected = useMemo(() => {
    if (visibleEmployeeIds.length === 0) return false;
    return visibleEmployeeIds.every((id) => selectedSet.has(id));
  }, [visibleEmployeeIds, selectedSet]);

  const handleToggleEmployee = useCallback((employeeId: string) => {
    const normalized = String(employeeId ?? "").trim();
    if (!normalized) return;

    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return Array.from(next);
    });
  }, []);

  const handleToggleVisible = useCallback(() => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleEmployeeIds) next.delete(id);
      } else {
        for (const id of visibleEmployeeIds) next.add(id);
      }
      return Array.from(next);
    });
  }, [allVisibleSelected, visibleEmployeeIds]);

  const handleSave = useCallback(async () => {
    if (!cameraId) return;

    try {
      setSaving(true);
      const response = await axiosInstance.put<CameraAuthorizedEmployeesState>(
        `${API.CAMERAS}/${cameraId}/authorized-employees`,
        {
          employeeIds: toSortedDistinctIds(selectedEmployeeIds),
        },
      );

      const nextState = response.data;
      setState(nextState);
      setSelectedEmployeeIds(
        toSortedDistinctIds(
          (nextState.employees || [])
            .filter((employee) => employee.selected)
            .map((employee) => employee.id),
        ),
      );

      if (nextState.warning) {
        toast.success(`Saved with warning: ${nextState.warning}`);
      } else {
        toast.success("Authorized employees updated");
      }

      if (onSaved) {
        await onSaved();
      }

      onClose();
    } catch (error: unknown) {
      toast.error(
        normalizeApiError(error, "Failed to update authorized employees"),
      );
    } finally {
      setSaving(false);
    }
  }, [cameraId, onClose, onSaved, selectedEmployeeIds]);

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Assign Authorized Employees"
      description={camera ? `Camera: ${camera.name}` : ""}
      maxWidth="3xl"
      overflowAuto
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
          Enrolled employees only. If no one is selected, this camera works for
          all enrolled employees.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[380px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee by name, ID, unit..."
              className="w-full rounded-lg border px-9 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleVisible}
              disabled={loading || filteredEmployees.length === 0}
              className="rounded-lg border px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
            >
              {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
            </button>
            <button
              type="button"
              onClick={() => void fetchState()}
              disabled={loading || saving || !cameraId}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
            Selected: {selectedEmployeeIds.length}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-zinc-700">
            Enrolled: {employees.length}
          </span>
          {search.trim() ? (
            <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
              Filtered: {filteredEmployees.length}
            </span>
          ) : null}
        </div>

        <div className="max-h-[360px] overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              {employees.length === 0
                ? "No enrolled employees found."
                : "No employees match your search."}
            </div>
          ) : (
            <div>
              {filteredEmployees.map((employee) => {
                const isChecked = selectedSet.has(employee.id);
                const employeeKey =
                  employee.empId || employee.publicId || employee.id;

                return (
                  <label
                    key={employee.id}
                    className="flex cursor-pointer items-start gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4"
                      checked={isChecked}
                      onChange={() => handleToggleEmployee(employee.id)}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-900">
                        {employee.name}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        ID: {employeeKey}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving || !cameraId}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </ReusableModal>
  );
}
