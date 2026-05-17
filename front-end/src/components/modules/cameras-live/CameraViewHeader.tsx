import { memo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpDown, ListVideo } from "lucide-react";

type CameraViewHeaderProps = {
  title?: string;
  description?: ReactNode;
  totalScreens: number;
  activeScreens: number;
  offlineScreens: number;
  cameraSortOrder: "asc" | "desc";
  onToggleCameraSortOrder: () => void;
  actionHref?: string;
  actionLabel?: string;
};

const CameraViewHeader = memo(function CameraViewHeader({
  title = "Camera View",
  description,
  totalScreens,
  activeScreens,
  offlineScreens,
  cameraSortOrder,
  onToggleCameraSortOrder,
  actionHref = "/camera-list",
  actionLabel = "Camera List",
}: CameraViewHeaderProps) {
  const sortOrderLabel =
    cameraSortOrder === "asc" ? "Ascending" : "Descending";

  return (
    <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        {description ? (
          <div className="mt-1 text-sm text-zinc-500">{description}</div>
        ) : null}
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
          href={actionHref}
          className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <ListVideo className="mr-2 h-4 w-4" />
          {actionLabel}
        </Link>
      </div>
    </header>
  );
});

CameraViewHeader.displayName = "CameraViewHeader";

export default CameraViewHeader;
