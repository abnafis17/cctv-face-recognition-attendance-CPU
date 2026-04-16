"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import axiosInstance, { API } from "@/config/axiosInstance";
import type {
  RelayApiRow,
  RelaySettingsResponse,
} from "@/components/settings/types";
import { buildRelayColumns } from "@/components/settings/relay/relayColumns";
import {
  normalizeRelayApiRow,
  searchMatchesRelayRow,
} from "@/components/settings/utils";

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

export function useRelaySettingsPanel() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<RelayApiRow[]>([]);

  const [addRelayUrlType, setAddRelayUrlType] = useState("");
  const [addRelayOnUrl, setAddRelayOnUrl] = useState("");
  const [addRelaySilentUrl, setAddRelaySilentUrl] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<RelayApiRow | null>(null);
  const [editRelayUrlType, setEditRelayUrlType] = useState("");
  const [editRelayOnUrl, setEditRelayOnUrl] = useState("");
  const [editRelaySilentUrl, setEditRelaySilentUrl] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedForDelete, setSelectedForDelete] =
    useState<RelayApiRow | null>(null);

  const fetchRelaySettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<RelaySettingsResponse[]>(
        API.SETTINGS_RELAY,
        {
          params: { all: true },
        },
      );
      const nextRows = Array.isArray(res?.data)
        ? res.data
            .map((item) => normalizeRelayApiRow(item))
            .filter((row): row is RelayApiRow => row !== null)
        : [];
      setRows(nextRows);
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
    setAddRelayUrlType("");
    setAddRelayOnUrl("");
    setAddRelaySilentUrl("");
  }, []);

  const submitAdd = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const urlType = asTrimmed(addRelayUrlType);
      const relayOnUrl = asTrimmed(addRelayOnUrl);
      const relaySilentUrl = asTrimmed(addRelaySilentUrl);

      if (!relayOnUrl && !relaySilentUrl) {
        toast.error("Enter at least one API URL");
        return;
      }

      try {
        setSaving(true);
        await axiosInstance.post(API.SETTINGS_RELAY, {
          urlType: urlType || undefined,
          relayOnUrl,
          relaySilentUrl,
        });
        toast.success("Relay URLs added");
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
      addRelayUrlType,
      clearAddForm,
      fetchRelaySettings,
    ],
  );

  const openEditModal = useCallback((row: RelayApiRow) => {
    setEditRow(row);
    setEditRelayUrlType(row.urlType ?? "");
    setEditRelayOnUrl(row.relayOnUrl ?? "");
    setEditRelaySilentUrl(row.relaySilentUrl ?? "");
    setEditOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditOpen(false);
    setEditRow(null);
    setEditRelayUrlType("");
    setEditRelayOnUrl("");
    setEditRelaySilentUrl("");
  }, []);

  const submitEdit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editRow) return;

      const urlType = asTrimmed(editRelayUrlType);
      const relayOnUrl = asTrimmed(editRelayOnUrl);
      const relaySilentUrl = asTrimmed(editRelaySilentUrl);

      if (!relayOnUrl && !relaySilentUrl) {
        toast.error("Use Delete if you want to remove all URLs");
        return;
      }

      const nextUrlType = urlType || editRow.urlType || undefined;

      try {
        setSaving(true);
        await axiosInstance.patch(API.SETTINGS_RELAY, {
          id: editRow.id,
          urlType: nextUrlType,
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
      editRelayUrlType,
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
      await axiosInstance.delete(API.SETTINGS_RELAY, {
        data: { id: selectedForDelete.id },
      });
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

  const relay_statCards = useMemo(
    () => [
      { label: "Total Entries", value: totalEntries, tone: "text-zinc-900" },
      { label: "ON URL Set", value: onConfigured, tone: "text-emerald-700" },
      {
        label: "Silent URL Set",
        value: silentConfigured,
        tone: "text-sky-700",
      },
      {
        label: "Fully Configured",
        value: fullyConfigured,
        tone: "text-amber-700",
      },
    ],
    [fullyConfigured, onConfigured, silentConfigured, totalEntries],
  );

  return {
    loading,
    saving,
    deleting,
    search,
    setSearch,
    rows,

    addRelayUrlType,
    setAddRelayUrlType,
    addRelayOnUrl,
    setAddRelayOnUrl,
    addRelaySilentUrl,
    setAddRelaySilentUrl,

    editOpen,
    editRow,
    editRelayUrlType,
    setEditRelayUrlType,
    editRelayOnUrl,
    setEditRelayOnUrl,
    editRelaySilentUrl,
    setEditRelaySilentUrl,

    showDeleteModal,
    selectedForDelete,
    setSelectedForDelete,

    fetchRelaySettings,
    clearAddForm,
    submitAdd,

    openEditModal,
    closeEditModal,
    submitEdit,

    openDeleteModal,
    handleDelete,

    filteredRows,
    relay_columns,
    relay_statCards,

    setShowDeleteModal,
  };
}
