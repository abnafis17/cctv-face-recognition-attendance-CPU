"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Search } from "lucide-react";
import toast from "react-hot-toast";

import axiosInstance, { API } from "@/config/axiosInstance";
import { TanstackDataTable } from "@/components/reusable/TanstackDataTable";
import ReusableModal from "@/components/reusable/ReusableModal";
import ConfirmationModal from "@/components/reusable/ConfirmationModal";
import type { ErpApiRow, ErpSettingsResponse } from "../types";
import { buildErpColumns } from "./erpColumns";
import { normalizeErpApiRow, searchMatchesErpRow } from "../utils";

function toMessage(error: unknown, fallback: string): string {
  const anyError = error as any;
  return (
    anyError?.response?.data?.error ||
    anyError?.response?.data?.message ||
    anyError?.message ||
    fallback
  );
}

function asTrimmed(value: unknown): string {
  return String(value ?? "").trim();
}

export default function ErpSettingsTab() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ErpApiRow[]>([]);

  const [addErpBaseUrl, setAddErpBaseUrl] = useState("");
  const [addErpPrefix, setAddErpPrefix] = useState("");
  const [addErpAttendanceEndpoint, setAddErpAttendanceEndpoint] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<ErpApiRow | null>(null);
  const [editErpBaseUrl, setEditErpBaseUrl] = useState("");
  const [editErpPrefix, setEditErpPrefix] = useState("");
  const [editErpAttendanceEndpoint, setEditErpAttendanceEndpoint] =
    useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<ErpApiRow | null>(
    null,
  );

  const fetchErpSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<ErpSettingsResponse>(
        API.SETTINGS_ERP,
      );
      const row = normalizeErpApiRow(res?.data ?? {});
      setRows(row ? [row] : []);
    } catch (error: unknown) {
      toast.error(toMessage(error, "Failed to load ERP URLs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchErpSettings();
  }, [fetchErpSettings]);

  const clearAddForm = useCallback(() => {
    setAddErpBaseUrl("");
    setAddErpPrefix("");
    setAddErpAttendanceEndpoint("");
  }, []);

  const submitAdd = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const erpBaseUrl = asTrimmed(addErpBaseUrl);
      const erpPrefix = asTrimmed(addErpPrefix);
      const erpAttendanceEndpoint = asTrimmed(addErpAttendanceEndpoint);
      if (!erpBaseUrl && !erpPrefix && !erpAttendanceEndpoint) {
        toast.error("Enter at least one ERP field");
        return;
      }

      try {
        setSaving(true);
        await axiosInstance.post(API.SETTINGS_ERP, {
          erpBaseUrl,
          erpPrefix,
          erpAttendanceEndpoint,
        });
        toast.success(rows.length > 0 ? "ERP URLs updated" : "ERP URLs added");
        clearAddForm();
        await fetchErpSettings();
      } catch (error: unknown) {
        toast.error(toMessage(error, "Failed to save ERP URLs"));
      } finally {
        setSaving(false);
      }
    },
    [
      addErpAttendanceEndpoint,
      addErpBaseUrl,
      addErpPrefix,
      clearAddForm,
      fetchErpSettings,
      rows.length,
    ],
  );

  const openEditModal = useCallback((row: ErpApiRow) => {
    setEditRow(row);
    setEditErpBaseUrl(row.erpBaseUrl ?? "");
    setEditErpPrefix(row.erpPrefix ?? "");
    setEditErpAttendanceEndpoint(row.erpAttendanceEndpoint ?? "");
    setEditOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditOpen(false);
    setEditRow(null);
    setEditErpBaseUrl("");
    setEditErpPrefix("");
    setEditErpAttendanceEndpoint("");
  }, []);

  const submitEdit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editRow) return;

      const erpBaseUrl = asTrimmed(editErpBaseUrl);
      const erpPrefix = asTrimmed(editErpPrefix);
      const erpAttendanceEndpoint = asTrimmed(editErpAttendanceEndpoint);
      if (!erpBaseUrl && !erpPrefix && !erpAttendanceEndpoint) {
        toast.error("Use Delete if you want to remove all ERP settings");
        return;
      }

      try {
        setSaving(true);
        await axiosInstance.patch(API.SETTINGS_ERP, {
          erpBaseUrl,
          erpPrefix,
          erpAttendanceEndpoint,
        });
        toast.success("ERP URLs updated");
        closeEditModal();
        await fetchErpSettings();
      } catch (error: unknown) {
        toast.error(toMessage(error, "Failed to update ERP URLs"));
      } finally {
        setSaving(false);
      }
    },
    [
      closeEditModal,
      editErpAttendanceEndpoint,
      editErpBaseUrl,
      editErpPrefix,
      editRow,
      fetchErpSettings,
    ],
  );

  const openDeleteModal = useCallback((row: ErpApiRow) => {
    setSelectedForDelete(row);
    setShowDeleteModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(API.SETTINGS_ERP);
      toast.success("ERP URLs deleted");
      setShowDeleteModal(false);
      setSelectedForDelete(null);
      await fetchErpSettings();
    } catch (error: unknown) {
      toast.error(toMessage(error, "Failed to delete ERP URLs"));
    } finally {
      setDeleting(false);
    }
  }, [fetchErpSettings, selectedForDelete]);

  const filteredRows = useMemo(
    () => rows.filter((row) => searchMatchesErpRow(row, search)),
    [rows, search],
  );

  const columns = useMemo(
    () =>
      buildErpColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    [openDeleteModal, openEditModal],
  );

  const totalEntries = rows.length;
  const baseConfigured = rows.filter((row) =>
    Boolean(asTrimmed(row.erpBaseUrl)),
  ).length;
  const prefixConfigured = rows.filter((row) =>
    Boolean(asTrimmed(row.erpPrefix)),
  ).length;
  const endpointConfigured = rows.filter((row) =>
    Boolean(asTrimmed(row.erpAttendanceEndpoint)),
  ).length;

  const statCards = [
    { label: "Total Entries", value: totalEntries, tone: "text-zinc-900" },
    { label: "Base URL Set", value: baseConfigured, tone: "text-emerald-700" },
    {
      label: "Prefix Set (Optional)",
      value: prefixConfigured,
      tone: "text-sky-700",
    },
    {
      label: "Endpoint Set",
      value: endpointConfigured,
      tone: "text-amber-700",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-white px-4 py-3 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {card.label}
            </div>
            <div className={`mt-1 text-2xl font-bold ${card.tone}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Add ERP URLs
            </h2>
            <p className="text-sm text-zinc-500">
              Company-wise ERP base URL, optional prefix, and dynamic attendance
              API endpoint.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
            <Plus className="mr-1 h-3.5 w-3.5" />
            ERP Configuration
          </span>
        </div>

        <form className="mt-4" onSubmit={submitAdd}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <input
              value={addErpBaseUrl}
              onChange={(event) => setAddErpBaseUrl(event.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="ERP Base URL (e.g. http://172.20.60.101:7001)"
              disabled={loading || saving}
            />
            <input
              value={addErpPrefix}
              onChange={(event) => setAddErpPrefix(event.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="ERP Prefix (optional, e.g. /api/v2)"
              disabled={loading || saving}
            />
            <input
              value={addErpAttendanceEndpoint}
              onChange={(event) =>
                setAddErpAttendanceEndpoint(event.target.value)
              }
              className="rounded-lg border px-3 py-2 text-sm"
              placeholder="ERP Attendance Endpoint (e.g. /Attendance/manual-attendance)"
              disabled={loading || saving}
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={clearAddForm}
              disabled={saving}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                saving ||
                (!asTrimmed(addErpBaseUrl) &&
                  !asTrimmed(addErpPrefix) &&
                  !asTrimmed(addErpAttendanceEndpoint))
              }
              className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving
                ? "Saving..."
                : rows.length > 0
                  ? "Update URLs"
                  : "Add URLs"}
            </button>
          </div>
        </form>
      </section>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900">
              ERP URL Inventory
            </div>
            <div className="text-sm text-zinc-500">
              Search, edit, and manage company ERP URL configuration.
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ERP URLs..."
                className="w-full rounded-lg border px-9 py-2 text-sm"
              />
            </div>

            <button
              onClick={() => void fetchErpSettings()}
              type="button"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <div className="min-w-350">
          <TanstackDataTable
            data={filteredRows}
            columns={columns}
            loading={loading}
            headerCellClassName="whitespace-nowrap bg-zinc-50"
          />
        </div>
      </div>

      <ReusableModal
        open={editOpen}
        onClose={closeEditModal}
        title="Edit ERP URLs"
        maxWidth="2xl"
      >
        <form className="space-y-3" onSubmit={submitEdit}>
          <div className="space-y-1.5">
            <label
              htmlFor="edit-erp-base-url"
              className="text-sm font-medium text-zinc-900"
            >
              ERP Base URL
            </label>
            <input
              id="edit-erp-base-url"
              value={editErpBaseUrl}
              onChange={(event) => setEditErpBaseUrl(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="http://172.20.60.101:7001"
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-erp-prefix"
              className="text-sm font-medium text-zinc-900"
            >
              ERP Prefix
            </label>
            <input
              id="edit-erp-prefix"
              value={editErpPrefix}
              onChange={(event) => setEditErpPrefix(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="/api/v2"
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-erp-endpoint"
              className="text-sm font-medium text-zinc-900"
            >
              ERP Attendance Endpoint
            </label>
            <input
              id="edit-erp-endpoint"
              value={editErpAttendanceEndpoint}
              onChange={(event) =>
                setEditErpAttendanceEndpoint(event.target.value)
              }
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="/Attendance/manual-attendance"
              disabled={saving}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </ReusableModal>

      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedForDelete(null);
        }}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete ERP URLs?"
        description="This will remove company ERP URL settings. Attendance and recognition will continue, but ERP push will be skipped."
      />
    </>
  );
}
