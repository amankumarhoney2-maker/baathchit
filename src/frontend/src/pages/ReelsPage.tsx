import { CommentSheet } from "@/components/CommentSheet";
import { ReelCard } from "@/components/ReelCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useListReels } from "@/hooks/useQueries";
import type { Reel } from "@/lib/types";
import { Clapperboard } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function ReelsPage() {
  const { data: reels, isLoading, isError, refetch } = useListReels();
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePlaybackError = useCallback((reelId: string) => {
    setFailedIds((ids) => (ids.includes(reelId) ? ids : [...ids, reelId]));
  }, []);

  const handleRetryPlayback = useCallback((reelId: string) => {
    setFailedIds((ids) => ids.filter((id) => id !== reelId));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !reels || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!Number.isNaN(index)) setActiveIndex(index);
          }
        }
      },
      { root: container, threshold: 0.6 },
    );

    const items = container.querySelectorAll("[data-reel-item]");
    for (const item of items) {
      observer.observe(item);
    }
    return () => observer.disconnect();
  }, [reels]);

  const failedCount = failedIds.length;

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full overflow-hidden bg-black">
      {isLoading ? (
        <div className="flex h-full flex-col">
          {Array.from({ length: 2 }, (_, i) => `reel-skeleton-${i}`).map(
            (id) => (
              <div key={id} className="relative h-full w-full overflow-hidden">
                <Skeleton className="h-full w-full rounded-none bg-muted" />
              </div>
            ),
          )}
        </div>
      ) : isError ? (
        <div
          data-ocid="reels.error_state"
          className="flex h-full flex-col items-center justify-center px-6 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <Clapperboard className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">
            Couldn't load reels
          </h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Something went wrong while fetching the feed. Try again.
          </p>
          <button
            type="button"
            data-ocid="reels.retry_button"
            onClick={() => void refetch()}
            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : reels && reels.length > 0 ? (
        <div
          ref={containerRef}
          data-ocid="reels.feed"
          className="h-full snap-y snap-mandatory overflow-y-scroll"
        >
          {failedCount > 0 ? (
            <output
              data-ocid="reels.playback_error_banner"
              className="pointer-events-none absolute inset-x-0 top-3 z-10 mx-auto w-fit rounded-full bg-destructive/90 px-4 py-1.5 text-xs font-medium text-destructive-foreground shadow-elevated"
            >
              {failedCount === 1
                ? "1 reel couldn't play"
                : `${failedCount} reels couldn't play`}
            </output>
          ) : null}
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              data-reel-item
              data-index={index}
              data-ocid={`reels.item.${index + 1}`}
              className="h-full w-full snap-start snap-always"
            >
              <ReelCard
                reel={reel}
                active={index === activeIndex}
                onOpenComments={setActiveReel}
                onPlaybackError={handlePlaybackError}
                onRetryPlayback={handleRetryPlayback}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          data-ocid="reels.empty_state"
          className="flex h-full flex-col items-center justify-center px-6 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <Clapperboard className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">
            No reels yet
          </h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            The feed is empty right now. Check back soon for new reels from the
            community.
          </p>
        </div>
      )}

      <CommentSheet
        reelId={activeReel?.id ?? ""}
        open={activeReel !== null}
        onOpenChange={(open) => {
          if (!open) setActiveReel(null);
        }}
      />
    </div>
  );
}
