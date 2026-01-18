"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { RelayAgent } from "../types";
import { cn } from "@/lib/utils";
import { TanstackDataTable } from "@/components/reusable/TanstackDataTable";

function isOnline(lastSeenAt: string | null, seconds = 30) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < seconds * 1000;
}

export default function AgentsTable({
  data,
  selectedAgentId,
  onSelect,
  loading,
}: {
  data: RelayAgent[];
  selectedAgentId: string;
  onSelect: (agent: RelayAgent) => void;
  loading?: boolean;
}) {
  const columns: ColumnDef<RelayAgent>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      enableSorting: true,
    },
    {
      header: "Status",
      id: "status",
      cell: ({ row }) => {
        const online = isOnline(row.original.lastSeenAt);
        return (
          <span
            className={cn(
              "text-xs font-semibold",
              online ? "text-green-700" : "text-slate-600"
            )}
          >
            {online ? "ONLINE" : "OFFLINE"}
          </span>
        );
      },
    },
    {
      header: "Last Seen",
      accessorKey: "lastSeenAt",
      cell: ({ row }) =>
        row.original.lastSeenAt
          ? new Date(row.original.lastSeenAt).toLocaleString()
          : "-",
    },
    {
      header: "Agent ID",
      accessorKey: "id",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.id}</span>
      ),
    },
  ];

  return (
    <TanstackDataTable
      data={data}
      columns={columns}
      loading={!!loading}
      customRow={(row: any) => {
        const a = row.original as RelayAgent;
        const selected = a.id === selectedAgentId;
        return (
          <tr
            key={a.id}
            onClick={() => onSelect(a)}
            className={cn(
              "cursor-pointer hover:bg-slate-50",
              selected ? "bg-slate-100" : ""
            )}
          >
            {row.getAllCells().map((cell: any) => (
              <td
                key={cell.id}
                className="border border-gray-100 px-2 py-1 align-middle"
              >
                {/* reuse internal cell renderer */}
                {(cell.column.columnDef.cell as any)?.(cell.getContext()) ??
                  String(cell.getValue() ?? "")}
              </td>
            ))}
          </tr>
        );
      }}
    />
  );
}
