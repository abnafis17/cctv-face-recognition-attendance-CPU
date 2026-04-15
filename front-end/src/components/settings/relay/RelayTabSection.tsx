import { RelayStatCards } from "./RelayStatCards";
import { RelayAddSection } from "./RelayAddSection";
import { RelayInventoryToolbar } from "./RelayInventoryToolbar";
import { RelayTableSection } from "./RelayTableSection";
import { ColumnDef } from "@tanstack/react-table";

type RelayStatCard = {
  label: string;
  value: string | number;
  tone: string;
};

type RelayTabSectionProps<TData, TValue> = {
  statCards: RelayStatCard[];

  addRelayOnUrl: string;
  setAddRelayOnUrl: React.Dispatch<React.SetStateAction<string>>;

  addRelaySilentUrl: string;
  setAddRelaySilentUrl: React.Dispatch<React.SetStateAction<string>>;

  loading: boolean;
  saving: boolean;

  rows: TData[];

  submitAdd: (event: React.FormEvent<HTMLFormElement>) => void;
  clearAddForm: () => void;

  asTrimmed: (value: string) => string;

  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;

  fetchRelaySettings: () => Promise<void> | void;

  filteredRows: TData[];
  columns: ColumnDef<TData, TValue>[];
};

export function RelayTabSection<TData, TValue>({
  statCards,

  addRelayOnUrl,
  setAddRelayOnUrl,

  addRelaySilentUrl,
  setAddRelaySilentUrl,

  loading,
  saving,

  rows,

  submitAdd,
  clearAddForm,
  asTrimmed,

  search,
  setSearch,

  fetchRelaySettings,

  filteredRows,
  columns,
}: RelayTabSectionProps<TData, TValue>) {
  return (
    <div className="space-y-4">
      <RelayStatCards statCards={statCards} />

      <RelayAddSection
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
      />

      <RelayInventoryToolbar
        search={search}
        setSearch={setSearch}
        loading={loading}
        fetchRelaySettings={fetchRelaySettings}
      />

      <RelayTableSection
        filteredRows={filteredRows}
        columns={columns}
        loading={loading}
      />
    </div>
  );
}
