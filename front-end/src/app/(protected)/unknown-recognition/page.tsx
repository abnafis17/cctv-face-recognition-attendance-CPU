"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, RefreshCcw } from "lucide-react";
import axiosInstance, { API } from "@/config/axiosInstance";
import Pagination from "@/components/reusable/Pagination";

type UnknownRecognitionRow = {
  id: string;
  name?: string;
  timestamp: string;
  cameraId?: string | null;
  cameraName?: string | null;
};

type SortOrder = "asc" | "desc";

type RangeValue = {
  from: string;
  to: string;
};

const UNKNOWN_HISTORY_FETCH_LIMIT = 500;
const UNKNOWN_HISTORY_PAGE_LIMIT = 100;

function dhakaTodayYYYYMMDD(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function toIsoFromParts(
  dateValue: string,
  timeValue: string,
  isEnd: boolean,
): string {
  const date = String(dateValue || "").trim();
  if (!date) return "";

  const time = String(timeValue || "").trim();
  const hhmmss = time
    ? `${time}${time.length === 5 ? ":00" : ""}`
    : isEnd
      ? "23:59:59"
      : "00:00:00";

  const local = new Date(`${date}T${hhmmss}`);
  if (Number.isNaN(local.getTime())) return "";
  return local.toISOString();
}

function formatDatePart(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTimePart(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function UnknownRecognitionPage() {
  const [rows, setRows] = useState<UnknownRecognitionRow[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    dhakaTodayYYYYMMDD(),
  );
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [range, setRange] = useState<RangeValue>(() => {
    const today = dhakaTodayYYYYMMDD();
    return {
      from: toIsoFromParts(today, "", false),
      to: toIsoFromParts(today, "", true),
    };
  });

  const inFlightRef = useRef(false);

  const fetchUnknownRecognitions = useCallback(
    async (overrideRange?: RangeValue) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setLoading(true);

      const activeRange = overrideRange ?? range;

      try {
        const params: Record<string, string | number> = {
          limit: UNKNOWN_HISTORY_FETCH_LIMIT,
        };
        if (activeRange.from) params.from = activeRange.from;
        if (activeRange.to) params.to = activeRange.to;

        const response = await axiosInstance.get(
          `${API.UNKNOWN_RECOGNITIONS}`,
          {
            params,
          },
        );

        if (response?.status === 200) {
          setRows((response?.data || []) as UnknownRecognitionRow[]);
          setErr("");
        }
      } catch (error) {
        const errorMessage =
          (error as any)?.response?.data?.error ||
          (error as any)?.response?.data?.message ||
          "Failed to load unknown recognition history";
        setErr(errorMessage);
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [range],
  );

  useEffect(() => {
    const first = window.setTimeout(() => {
      void fetchUnknownRecognitions();
    }, 0);

    const interval = window.setInterval(() => {
      void fetchUnknownRecognitions();
    }, 5000);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [fetchUnknownRecognitions]);

  const buildDateRange = useCallback(
    (
      dateValue: string,
      startTime: string,
      endTime: string,
    ): RangeValue | null => {
      const date = String(dateValue || "").trim();
      if (!date) return null;

      const fromIso = toIsoFromParts(date, startTime, false);
      const toIso = toIsoFromParts(date, endTime, true);
      if (!fromIso || !toIso) return null;

      return { from: fromIso, to: toIso };
    },
    [],
  );

  const applyFilters = useCallback(() => {
    const nextRange = buildDateRange(selectedDate, fromTime, toTime);
    if (!nextRange) {
      setErr("Select a valid date/time range");
      return;
    }

    if (Date.parse(nextRange.from) > Date.parse(nextRange.to)) {
      setErr("From time must be earlier than To time");
      return;
    }

    setErr("");
    setRange(nextRange);
    void fetchUnknownRecognitions(nextRange);
  }, [
    buildDateRange,
    fetchUnknownRecognitions,
    selectedDate,
    fromTime,
    toTime,
  ]);

  const clearFilters = useCallback(() => {
    setFromTime("");
    setToTime("");

    const activeDate = selectedDate || dhakaTodayYYYYMMDD();
    if (!selectedDate) setSelectedDate(activeDate);

    const nextRange = buildDateRange(activeDate, "", "");
    if (!nextRange) return;

    setErr("");
    setRange(nextRange);
    void fetchUnknownRecognitions(nextRange);
  }, [buildDateRange, fetchUnknownRecognitions, selectedDate]);

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const aTime = Date.parse(a.timestamp || "");
      const bTime = Date.parse(b.timestamp || "");

      const aValid = Number.isFinite(aTime);
      const bValid = Number.isFinite(bTime);

      if (!aValid && !bValid) return a.id.localeCompare(b.id);
      if (!aValid) return 1;
      if (!bValid) return -1;

      const diff = aTime - bTime;
      if (diff !== 0) return sortOrder === "asc" ? diff : -diff;
      return a.id.localeCompare(b.id);
    });
    return next;
  }, [rows, sortOrder]);

  const paginationResetKey = useMemo(
    () => `${range.from}|${range.to}`,
    [range.from, range.to],
  );

  const effectivePage = useMemo(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(sortedRows.length / UNKNOWN_HISTORY_PAGE_LIMIT),
    );
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, sortedRows.length]);

  const skip = useMemo(
    () => (effectivePage - 1) * UNKNOWN_HISTORY_PAGE_LIMIT,
    [effectivePage],
  );

  const paginatedRows = useMemo(
    () => sortedRows.slice(skip, skip + UNKNOWN_HISTORY_PAGE_LIMIT),
    [sortedRows, skip],
  );

  const getCurrentPage = useCallback((page: number) => {
    const normalized = Math.max(1, Number(page) || 1);
    setCurrentPage(normalized);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [paginationResetKey]);

  return (
    <div>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="page-header">
          <h1 className="page-title">Unknown Recognition History</h1>
          <p className="page-subtitle">
            Company-wise unknown face detections with date-time filters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchUnknownRecognitions()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            title="Refresh unknown recognition history"
            aria-label="Refresh unknown recognition history"
            disabled={loading}
          >
            <RefreshCcw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            title="Toggle time order"
            aria-label="Toggle time sort order"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Time Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                step={1}
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                type="time"
                step={1}
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">SL</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Camera Name</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((r, index) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{skip + index + 1}</td>
                <td className="px-4 py-2 font-medium">{r.name || "Unknown"}</td>
                <td className="px-4 py-2">{formatDatePart(r.timestamp)}</td>
                <td className="px-4 py-2">{formatTimePart(r.timestamp)}</td>
                <td className="px-4 py-2">{r.cameraName ?? "N/A"}</td>
              </tr>
            ))}

            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No unknown recognition records found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {sortedRows.length > 0 ? (
        <div className="mt-4">
          <Pagination
            numberOfData={sortedRows.length}
            limits={UNKNOWN_HISTORY_PAGE_LIMIT}
            getCurrentPage={getCurrentPage}
            activeTab2={paginationResetKey}
          />
        </div>
      ) : null}
    </div>
  );
}
