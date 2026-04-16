import { Plus, Save } from "lucide-react";
import type { FormEvent } from "react";

type RelayAddSectionProps = {
  addRelayUrlType: string;
  setAddRelayUrlType: React.Dispatch<React.SetStateAction<string>>;
  addRelayOnUrl: string;
  setAddRelayOnUrl: React.Dispatch<React.SetStateAction<string>>;
  addRelaySilentUrl: string;
  setAddRelaySilentUrl: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  saving: boolean;
  submitAdd: (event: FormEvent<HTMLFormElement>) => void;
  clearAddForm: () => void;
  asTrimmed: (value: string) => string;
};

export function RelayAddSection({
  addRelayUrlType,
  setAddRelayUrlType,
  addRelayOnUrl,
  setAddRelayOnUrl,
  addRelaySilentUrl,
  setAddRelaySilentUrl,
  loading,
  saving,
  submitAdd,
  clearAddForm,
  asTrimmed,
}: RelayAddSectionProps) {
  return (
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <input
            value={addRelayUrlType}
            onChange={(event) => setAddRelayUrlType(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="URL Type (optional, default: door)"
            disabled={loading || saving}
          />

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
            {saving ? "Saving..." : "Add URLs"}
          </button>
        </div>
      </form>
    </section>
  );
}
