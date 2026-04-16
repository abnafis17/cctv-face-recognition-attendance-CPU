import { RefreshCw, Search } from "lucide-react";

type RelayInventoryToolbarProps = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  fetchRelaySettings: () => Promise<void> | void;
};

export function RelayInventoryToolbar({
  search,
  setSearch,
  loading,
  fetchRelaySettings,
}: RelayInventoryToolbarProps) {
  return (
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
  );
}
