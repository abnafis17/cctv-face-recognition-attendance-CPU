import { TanstackDataTable } from "@/components/reusable/TanstackDataTable";
import { ColumnDef } from "@tanstack/react-table";

type RelayTableSectionProps<TData, TValue> = {
  filteredRows: TData[];
  columns: ColumnDef<TData, TValue>[];
  loading: boolean;
};

export function RelayTableSection<TData, TValue>({
  filteredRows,
  columns,
  loading,
}: RelayTableSectionProps<TData, TValue>) {
  return (
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
  );
}
