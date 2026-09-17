import { useDeleteStatus } from "@/hooks/useQueries";
import type { Status } from "@/lib/types";
import { Loader2, MessageSquareText, Trash2 } from "lucide-react";
import { useState } from "react";

function formatRelativeTime(createdAt: bigint): string {
  const date = new Date(Number(createdAt / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "Just now";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function StatusItem({
  status,
  canDelete,
  index,
}: {
  status: Status;
  canDelete: boolean;
  index: number;
}) {
  const deleteStatus = useDeleteStatus();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    deleteStatus.mutate(
      { id: status.id, authorPrincipal: status.authorPrincipal },
      {
        onError: () => {
          setError("Could not delete this status. Please try again.");
        },
      },
    );
  };

  return (
    <article
      data-ocid={`status.item.${index}`}
      className="rounded-2xl border border-border bg-card p-4 shadow-subtle"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-foreground">
            {status.author}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatRelativeTime(status.createdAt)}
          </p>
        </div>
        {canDelete ? (
          <button
            type="button"
            data-ocid={`status.delete_button.${index}`}
            aria-label="Delete status"
            onClick={handleDelete}
            disabled={deleteStatus.isPending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-smooth hover:bg-muted hover:text-destructive disabled:opacity-50"
          >
            {deleteStatus.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </header>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
        {status.text}
      </p>

      {status.imageUrl ? (
        <img
          data-ocid={`status.image.${index}`}
          src={status.imageUrl}
          alt={`Attachment from ${status.author}`}
          className="mt-3 max-h-80 w-full rounded-xl border border-border object-cover"
        />
      ) : null}

      {error ? (
        <p
          data-ocid={`status.item_error.${index}`}
          role="alert"
          className="mt-2 text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function StatusList({
  statuses,
  isLoading,
  currentPrincipal,
  canDelete = true,
  emptyMessage = "No statuses or notes yet.",
}: {
  statuses: Status[];
  isLoading: boolean;
  currentPrincipal: string;
  canDelete?: boolean;
  emptyMessage?: string;
}) {
  if (isLoading) {
    return (
      <div
        data-ocid="status.loading_state"
        aria-label="Loading statuses"
        className="space-y-3"
      >
        {Array.from({ length: 2 }, (_, i) => `status-skeleton-${i}`).map(
          (id) => (
            <div
              key={id}
              className="h-28 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ),
        )}
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div
        data-ocid="status.empty_state"
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center"
      >
        <MessageSquareText className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-display text-sm font-semibold text-foreground">
          {emptyMessage}
        </p>
        <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
          Post a quick note to share what you are up to.
        </p>
      </div>
    );
  }

  return (
    <div data-ocid="status.list" className="space-y-3">
      {statuses.map((status, index) => (
        <StatusItem
          key={status.id}
          status={status}
          index={index + 1}
          canDelete={canDelete && status.authorPrincipal === currentPrincipal}
        />
      ))}
    </div>
  );
}
