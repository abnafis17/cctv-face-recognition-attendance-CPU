import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { LeaveType } from "@/types/gatepass-types";

type Props = {
  historySearch: string;
  historyFromDate: string;
  historyToDate: string;
  historyLeaveType: LeaveType | "";
  historyError: string;
  setHistorySearch: React.Dispatch<React.SetStateAction<string>>;
  setHistoryFromDate: React.Dispatch<React.SetStateAction<string>>;
  setHistoryToDate: React.Dispatch<React.SetStateAction<string>>;
  setHistoryLeaveType: React.Dispatch<React.SetStateAction<LeaveType | "">>;
  resetHistoryFilters: () => void;
  fetchHistoryRecords: (silent?: boolean) => Promise<void>;
};

export default function GatepassHistoryFilters({
  historySearch,
  historyFromDate,
  historyToDate,
  historyLeaveType,
  historyError,
  setHistorySearch,
  setHistoryFromDate,
  setHistoryToDate,
  setHistoryLeaveType,
  resetHistoryFilters,
  fetchHistoryRecords,
}: Props) {
  return (
    <div className="border-b border-zinc-100 bg-white px-4 pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:gap-2.5">
        <div className="space-y-1.5 xl:w-[320px] xl:min-w-[280px] xl:flex-none">
          <label className="text-[11px] font-medium text-zinc-500">
            Search
          </label>
          <Input
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Search by employee name or ID"
            className="h-10 rounded-xl border-zinc-100 bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex-1 xl:grid-cols-none xl:grid-flow-col xl:auto-cols-[minmax(140px,1fr)] xl:gap-2.5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-500">
              From Date
            </label>
            <input
              type="date"
              value={historyFromDate}
              onChange={(event) => setHistoryFromDate(event.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-100 bg-white px-3 text-sm text-zinc-900 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-500">
              To Date
            </label>
            <input
              type="date"
              value={historyToDate}
              onChange={(event) => setHistoryToDate(event.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-100 bg-white px-3 text-sm text-zinc-900 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-500">
              Leave Type
            </label>
            <Select
              value={historyLeaveType || "all"}
              onValueChange={(value) =>
                setHistoryLeaveType(value === "all" ? "" : (value as LeaveType))
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-zinc-100 bg-white text-sm text-zinc-900">
                <SelectValue placeholder="All leave types" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All Leave Types</SelectItem>
                <SelectItem value="short">Short Leave</SelectItem>
                <SelectItem value="long">Long Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 items-end gap-2 sm:col-span-2 xl:flex xl:justify-end xl:self-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-zinc-100 bg-white text-zinc-700"
              onClick={resetHistoryFilters}
            >
              Today
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-zinc-100 bg-white text-zinc-700"
              onClick={() => {
                void fetchHistoryRecords();
              }}
            >
              Refresh
            </Button>
          </div>
        </div>

      </div>

      {historyError ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {historyError}
        </div>
      ) : null}
    </div>
  );
}
