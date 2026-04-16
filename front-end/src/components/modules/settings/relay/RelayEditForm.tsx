import { Save } from "lucide-react";
import type { FormEvent } from "react";

type RelayEditFormProps = {
  editRelayUrlType: string;
  setEditRelayUrlType: React.Dispatch<React.SetStateAction<string>>;
  editRelayOnUrl: string;
  setEditRelayOnUrl: React.Dispatch<React.SetStateAction<string>>;
  editRelaySilentUrl: string;
  setEditRelaySilentUrl: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  submitEdit: (event: FormEvent<HTMLFormElement>) => void;
  closeEditModal: () => void;
};

export function RelayEditForm({
  editRelayUrlType,
  setEditRelayUrlType,
  editRelayOnUrl,
  setEditRelayOnUrl,
  editRelaySilentUrl,
  setEditRelaySilentUrl,
  saving,
  submitEdit,
  closeEditModal,
}: RelayEditFormProps) {
  return (
    <form className="space-y-3" onSubmit={submitEdit}>
      <div className="space-y-1.5">
        <label
          htmlFor="edit-relay-url-type"
          className="text-sm font-medium text-zinc-900"
        >
          URL Type
        </label>
        <input
          id="edit-relay-url-type"
          value={editRelayUrlType}
          onChange={(event) => setEditRelayUrlType(event.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="door"
          disabled={saving}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="edit-relay-on-url"
          className="text-sm font-medium text-zinc-900"
        >
          Relay ON URL
        </label>
        <input
          id="edit-relay-on-url"
          value={editRelayOnUrl}
          onChange={(event) => setEditRelayOnUrl(event.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="http://10.81.100.72/on"
          disabled={saving}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="edit-relay-silent-url"
          className="text-sm font-medium text-zinc-900"
        >
          Relay Silent URL
        </label>
        <input
          id="edit-relay-silent-url"
          value={editRelaySilentUrl}
          onChange={(event) => setEditRelaySilentUrl(event.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="http://10.81.100.72/silent"
          disabled={saving}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={closeEditModal}
          className="rounded-lg border px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={saving}
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
