"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/reusable/ConfirmationModal";
import type { Camera } from "../types";
import { deleteCamera, startCamera, stopCamera } from "../api";
import { TanstackDataTable } from "@/components/reusable/TanstackDataTable";

export default function AgentCamerasTable({
  cameras,
  loading,
  onChanged,
}: {
  cameras: Camera[];
  loading?: boolean;
  onChanged: () => void;
}) {
  const [deleteId, setDeleteId] = useState<string>("");
  const [busyId, setBusyId] = useState<string>("");

  const columns: ColumnDef<Camera>[] = useMemo(
    () => [
      { header: "Name", accessorKey: "name", enableSorting: true },
      {
        header: "Active",
        id: "active",
        cell: ({ row }) => (row.original.isActive ? "Yes" : "No"),
      },
      {
        header: "Send",
        id: "send",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <span className="text-xs font-mono">
              {c.sendFps ?? 2}fps {c.sendWidth ?? 640}x{c.sendHeight ?? 360} q
              {c.jpegQuality ?? 70}
            </span>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex gap-2">
              {c.isActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === c.id}
                  onClick={async () => {
                    setBusyId(c.id);
                    try {
                      await stopCamera(c.id);
                      onChanged();
                    } finally {
                      setBusyId("");
                    }
                  }}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={busyId === c.id}
                  onClick={async () => {
                    setBusyId(c.id);
                    try {
                      await startCamera(c.id);
                      onChanged();
                    } finally {
                      setBusyId("");
                    }
                  }}
                >
                  Start
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteId(c.id)}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [busyId, onChanged]
  );

  return (
    <>
      <TanstackDataTable data={cameras} columns={columns} loading={!!loading} />

      <ConfirmationModal
        open={!!deleteId}
        onClose={() => setDeleteId("")}
        onConfirm={async () => {
          if (!deleteId) return;
          setBusyId(deleteId);
          try {
            await deleteCamera(deleteId);
            onChanged();
          } finally {
            setBusyId("");
            setDeleteId("");
          }
        }}
        title="Delete camera?"
        description="This will remove the camera from this company."
        loading={busyId === deleteId && !!deleteId}
      />
    </>
  );
}
