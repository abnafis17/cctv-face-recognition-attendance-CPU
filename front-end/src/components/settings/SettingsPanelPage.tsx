"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance, { API } from "@/config/axiosInstance";
import ReusableModal from "@/components/reusable/ReusableModal";
import ConfirmationModal from "@/components/reusable/ConfirmationModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RelayApiRow, RelaySettingsResponse } from "./types";
import { buildRelayColumns } from "./relay/relayColumns";
import { normalizeRelayApiRow, searchMatchesRelayRow } from "./utils";
import ErpSettingsTab from "./erp/ErpSettingsTab";
import { RelayTabSection } from "./relay/RelayTabSection";
import { RelayEditForm } from "./relay/RelayEditForm";

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

export default function SettingsPanelPage() {
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

  const relay_columns = useMemo(
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

  const relay_statCards = [
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
          <RelayTabSection
            statCards={relay_statCards}
            addRelayOnUrl={addRelayOnUrl}
            setAddRelayOnUrl={setAddRelayOnUrl}
            addRelaySilentUrl={addRelaySilentUrl}
            setAddRelaySilentUrl={setAddRelaySilentUrl}
            loading={loading}
            saving={saving}
            rows={rows}
            submitAdd={submitAdd}
            clearAddForm={clearAddForm}
            asTrimmed={asTrimmed}
            search={search}
            setSearch={setSearch}
            fetchRelaySettings={fetchRelaySettings}
            filteredRows={filteredRows}
            columns={relay_columns}
          />
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
        <RelayEditForm
          editRelayOnUrl={editRelayOnUrl}
          setEditRelayOnUrl={setEditRelayOnUrl}
          editRelaySilentUrl={editRelaySilentUrl}
          setEditRelaySilentUrl={setEditRelaySilentUrl}
          saving={saving}
          submitEdit={submitEdit}
          closeEditModal={closeEditModal}
        />
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
