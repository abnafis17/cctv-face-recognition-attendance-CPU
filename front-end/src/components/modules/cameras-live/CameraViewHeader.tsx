import { memo } from "react";
import Link from "next/link";
import { ArrowUpDown, ListVideo } from "lucide-react";

type CameraViewHeaderProps = {
  totalScreens: number;
  activeScreens: number;
  offlineScreens: number;
  cameraSortOrder: "asc" | "desc";
  onToggleCameraSortOrder: () => void;
};

const CameraViewHeader = memo(function CameraViewHeader({
  totalScreens,
  activeScreens,
  offlineScreens,
  cameraSortOrder,
  onToggleCameraSortOrder,
}: CameraViewHeaderProps) {
  const sortOrderLabel =
    cameraSortOrder === "asc" ? "Ascending" : "Descending";

  return (
    <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="page-header">
        <h1 className="page-title">Camera View</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600">
          <span>
            Total:{" "}
            <span className="font-semibold text-zinc-900">{totalScreens}</span>
          </span>
          <span className="h-3 w-px bg-zinc-200" />
          <span>
            Active:{" "}
            <span className="font-semibold text-emerald-700">
              {activeScreens}
            </span>
          </span>
          <span className="h-3 w-px bg-zinc-200" />
          <span>
            Offline:{" "}
            <span className="font-semibold text-zinc-700">
              {offlineScreens}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleCameraSortOrder}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          title="Toggle camera order"
          aria-label="Toggle camera sort order"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortOrderLabel}
        </button>

        <Link
          href="/camera-list"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <ListVideo className="mr-2 h-4 w-4" />
          Camera List
        </Link>
      </div>
    </header>
  );
});

CameraViewHeader.displayName = "CameraViewHeader";

export default CameraViewHeader;
