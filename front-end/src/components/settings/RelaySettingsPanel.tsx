"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Search } from "lucide-react";
import toast from "react-hot-toast";

import axiosInstance, { API } from "@/config/axiosInstance";
import { TanstackDataTable } from "@/components/reusable/TanstackDataTable";
import ReusableModal from "@/components/reusable/ReusableModal";
import ConfirmationModal from "@/components/reusable/ConfirmationModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RelayApiRow, RelaySettingsResponse } from "./types";
import { buildRelayColumns } from "./relayColumns";
import { normalizeRelayApiRow, searchMatchesRelayRow } from "./utils";
import ErpSettingsTab from "./ErpSettingsTab";

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

export default function RelaySettingsPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<RelayApiRow[]>([]);

  const [addRelayOnUrl, setAddRelayOnUrl] = useState("");
  const [addRelaySilentUrl, setAddRelaySilentUrl] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<RelayApiRow | null>(null);
  const [editRelayOnUrl, setEditRelayOnUrl] = useState("");
  const [editRelaySilentUrl, setEditRelaySilentUrl] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedForDelete, setSelectedForDelete] =
    useState<RelayApiRow | null>(null);

  const fetchRelaySettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<RelaySettingsResponse>(
        API.SETTINGS_RELAY,
      );
      const row = normalizeRelayApiRow(res?.data ?? {});
      setRows(row ? [row] : []);
    } catch (error: unknown) {
      toast.error(toMessage(error, "Failed to load relay API URLs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRelaySettings();
  }, [fetchRelaySettings]);

  const clearAddForm = useCallback(() => {
    setAddRelayOnUrl("");
    setAddRelaySilentUrl("");
  }, []);

  const submitAdd = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const relayOnUrl = asTrimmed(addRelayOnUrl);
      const relaySilentUrl = asTrimmed(addRelaySilentUrl);
      if (!relayOnUrl && !relaySilentUrl) {
        toast.error("Enter at least one API URL");
        return;
      }

      try {
        setSaving(true);
        await axiosInstance.post(API.SETTINGS_RELAY, {
          relayOnUrl,
          relaySilentUrl,
        });
        toast.success(
          rows.length > 0 ? "Relay URLs updated" : "Relay URLs added",
        );
        clearAddForm();
        await fetchRelaySettings();
      } catch (error: unknown) {
        toast.error(toMessage(error, "Failed to save relay API URLs"));
      } finally {
        setSaving(false);
      }
    },
    [
      addRelayOnUrl,
      addRelaySilentUrl,
      clearAddForm,
      fetchRelaySettings,
      rows.length,
    ],
  );

  const openEditModal = useCallback((row: RelayApiRow) => {
    setEditRow(row);
    setEditRelayOnUrl(row.relayOnUrl ?? "");
    setEditRelaySilentUrl(row.relaySilentUrl ?? "");
    setEditOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditOpen(false);
    setEditRow(null);
    setEditRelayOnUrl("");
    setEditRelaySilentUrl("");
  }, []);

  const submitEdit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editRow) return;

      const relayOnUrl = asTrimmed(editRelayOnUrl);
      const relaySilentUrl = asTrimmed(editRelaySilentUrl);
      if (!relayOnUrl && !relaySilentUrl) {
        toast.error("Use Delete if you want to remove all URLs");
        return;
      }

      try {
        setSaving(true);
        await axiosInstance.patch(API.SETTINGS_RELAY, {
          relayOnUrl,
          relaySilentUrl,
        });
        toast.success("Relay URLs updated");
        closeEditModal();
        await fetchRelaySettings();
      } catch (error: unknown) {
        toast.error(toMessage(error, "Failed to update relay API URLs"));
      } finally {
        setSaving(false);
      }
    },
    [
      closeEditModal,
      editRelayOnUrl,
      editRelaySilentUrl,
      editRow,
      fetchRelaySettings,
    ],
  );

  const openDeleteModal = useCallback((row: RelayApiRow) => {
    setSelectedForDelete(row);
    setShowDeleteModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(API.SETTINGS_RELAY);
      toast.success("Relay URLs deleted");
      setShowDeleteModal(false);
      setSelectedForDelete(null);
      await fetchRelaySettings();
    } catch (error: unknown) {
      toast.error(toMessage(error, "Failed to delete relay API URLs"));
    } finally {
      setDeleting(false);
    }
  }, [fetchRelaySettings, selectedForDelete]);

  const filteredRows = useMemo(
    () => rows.filter((row) => searchMatchesRelayRow(row, search)),
    [rows, search],
  );

  const columns = useMemo(
    () =>
      buildRelayColumns({
        onEdit: openEditModal,
        onDelete: openDeleteModal,
      }),
    [openDeleteModal, openEditModal],
  );

  const totalEntries = rows.length;
  const onConfigured = rows.filter((row) =>
    Boolean(asTrimmed(row.relayOnUrl)),
  ).length;
  const silentConfigured = rows.filter((row) =>
    Boolean(asTrimmed(row.relaySilentUrl)),
  ).length;
  const fullyConfigured = rows.filter(
    (row) =>
      Boolean(asTrimmed(row.relayOnUrl)) &&
      Boolean(asTrimmed(row.relaySilentUrl)),
  ).length;

  const statCards = [
    { label: "Total Entries", value: totalEntries, tone: "text-zinc-900" },
    { label: "ON URL Set", value: onConfigured, tone: "text-emerald-700" },
    { label: "Silent URL Set", value: silentConfigured, tone: "text-sky-700" },
    {
      label: "Fully Configured",
      value: fullyConfigured,
      tone: "text-amber-700",
    },
  ];

  return (
    <>
      <Tabs defaultValue="relay">
        <TabsList>
          <TabsTrigger value="relay">Relay API URLs</TabsTrigger>
          <TabsTrigger value="erp">ERP Urls</TabsTrigger>
        </TabsList>

        <TabsContent value="relay" className="space-y-4">
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
                  Add Relay API URLs
                </h2>
                <p className="text-sm text-zinc-500">
                  Company-wise URLs for attendance relay (`/on`) and silent door
                  unlock (`/silent`).
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Relay Configuration
              </span>
            </div>

            <form className="mt-4" onSubmit={submitAdd}>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <input
                  value={addRelayOnUrl}
                  onChange={(event) => setAddRelayOnUrl(event.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Relay ON URL (e.g. http://10.81.100.72/on)"
                  disabled={loading || saving}
                />
                <input
                  value={addRelaySilentUrl}
                  onChange={(event) => setAddRelaySilentUrl(event.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Relay Silent URL (e.g. http://10.81.100.72/silent)"
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
                    (!asTrimmed(addRelayOnUrl) && !asTrimmed(addRelaySilentUrl))
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
                  Relay API Inventory
                </div>
                <div className="text-sm text-zinc-500">
                  Search, edit, and manage company relay URL configuration.
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                <div className="relative w-full sm:w-[320px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search relay URLs..."
                    className="w-full rounded-lg border px-9 py-2 text-sm"
                  />
                </div>

                <button
                  onClick={() => void fetchRelaySettings()}
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
        </TabsContent>

        <TabsContent value="erp" className="space-y-4">
          <ErpSettingsTab />
        </TabsContent>
      </Tabs>

      <ReusableModal
        open={editOpen}
        onClose={closeEditModal}
        title="Edit Relay API URLs"
        maxWidth="2xl"
      >
        <form className="space-y-3" onSubmit={submitEdit}>
          <div className="space-y-1.5">
            <label
              htmlFor="edit-relay-on-url"
              className="text-sm font-medium text-zinc-900"
            >
              Relay ON URL
            </label>
            <input
              id="edit-relay-on-url"
              value={editRelayOnUrl}
              onChange={(event) => setEditRelayOnUrl(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="http://10.81.100.72/on"
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-relay-silent-url"
              className="text-sm font-medium text-zinc-900"
            >
              Relay Silent URL
            </label>
            <input
              id="edit-relay-silent-url"
              value={editRelaySilentUrl}
              onChange={(event) => setEditRelaySilentUrl(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="http://10.81.100.72/silent"
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
        title="Delete relay API URLs?"
        description="This will remove company relay URL settings. Recognition and attendance will continue, but no relay API call will be fired."
      />
    </>
  );
}
