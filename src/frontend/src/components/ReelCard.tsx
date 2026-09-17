import { useAuth } from "@/hooks/use-auth";
import {
  useGetUserProfile,
  useLikeReel,
  useSaveReel,
  useUnlikeReel,
  useUnsaveReel,
} from "@/hooks/useQueries";
import type { Reel } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Heart,
  Loader2,
  MessageCircle,
  Music2,
  RotateCcw,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ReelCardProps {
  reel: Reel;
  active: boolean;
  onOpenComments: (reel: Reel) => void;
  onPlaybackError?: (reelId: string) => void;
  onRetryPlayback?: (reelId: string) => void;
}

export function ReelCard({
  reel,
  active,
  onOpenComments,
  onPlaybackError,
  onRetryPlayback,
}: ReelCardProps) {
  const { identity } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [liked, setLiked] = useState(reel.likedByMe);
  const [saved, setSaved] = useState(reel.savedByMe);
  const [likeCount, setLikeCount] = useState(reel.likes);
  const [saveCount, setSaveCount] = useState(reel.saves);

  const videoUrl = reel.videoUrl;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) {
      void video.play().catch(() => {
        // autoplay may be blocked until the source is ready
      });
    } else {
      video.pause();
    }
  }, [active]);

  function handleLoadedData() {
    setIsBuffering(false);
    if (active) {
      void videoRef.current?.play().catch(() => {
        // autoplay may be blocked
      });
    }
  }

  function handleError() {
    setIsBuffering(false);
    setHasError(true);
    onPlaybackError?.(reel.id);
  }

  function retryPlayback() {
    setHasError(false);
    setIsBuffering(true);
    setReloadKey((key) => key + 1);
    onRetryPlayback?.(reel.id);
  }

  const callerText = identity?.getPrincipal().toText() ?? "";
  const isOwnUpload = reel.uploaderPrincipal === callerText;
  const { data: uploaderProfile } = useGetUserProfile(
    isOwnUpload ? "" : reel.uploaderPrincipal,
  );
  const showUploaderId = isOwnUpload || uploaderProfile?.isPublic !== false;
  const uploaderLabel = showUploaderId
    ? reel.uploader
    : uploaderProfile?.username
      ? `@${uploaderProfile.username}`
      : "Baathchit user";

  const likeMutation = useLikeReel();
  const unlikeMutation = useUnlikeReel();
  const saveMutation = useSaveReel();
  const unsaveMutation = useUnsaveReel();

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) {
      likeMutation.mutate(reel.id);
    } else {
      unlikeMutation.mutate(reel.id);
    }
  }

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    setSaveCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    if (next) {
      saveMutation.mutate(reel.id);
    } else {
      unsaveMutation.mutate(reel.id);
    }
  }

  async function share() {
    const shareData = {
      title: "Baathchit",
      text: `${uploaderLabel}: ${reel.caption}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed the share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${reel.caption} — ${window.location.href}`,
        );
      } catch {
        // clipboard unavailable
      }
    }
  }

  return (
    <article
      data-ocid="reel_card"
      className="relative h-full w-full overflow-hidden bg-black"
    >
      <video
        key={reloadKey}
        ref={videoRef}
        data-ocid="reel_card.video"
        className="absolute inset-0 h-full w-full object-cover"
        src={videoUrl || undefined}
        poster={videoUrl || undefined}
        muted
        loop
        playsInline
        preload={active ? "auto" : "metadata"}
        onLoadedData={handleLoadedData}
        onError={handleError}
      />

      {isBuffering && !hasError ? (
        <div
          data-ocid="reel_card.loading_state"
          aria-live="polite"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40"
        >
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <span className="sr-only">Loading reel video</span>
        </div>
      ) : null}

      {hasError ? (
        <div
          data-ocid="reel_card.error_state"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center"
        >
          <p className="font-display text-sm font-semibold text-white">
            This reel couldn't play
          </p>
          <p className="max-w-[240px] text-xs text-white/80">
            The video may still be processing. Try loading it again.
          </p>
          <button
            type="button"
            data-ocid="reel_card.retry_button"
            onClick={retryPlayback}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : null}

      {/* bottom overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-subtle px-4 pb-6 pt-24">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/80 text-primary-foreground">
            <Music2 className="h-4 w-4" />
          </span>
          {isOwnUpload ? (
            <span className="font-display text-sm font-semibold text-white">
              {uploaderLabel}
            </span>
          ) : (
            <Link
              to="/profile/$principal"
              params={{ principal: reel.uploaderPrincipal }}
              data-ocid="reel_card.uploader_link"
              className="pointer-events-auto font-display text-sm font-semibold text-white underline-offset-4 transition-smooth hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {uploaderLabel}
            </Link>
          )}
        </div>
        <p className="mt-2 max-w-[75%] text-sm leading-snug text-white/95">
          {reel.caption}
        </p>
      </div>

      {/* right action rail */}
      <div className="absolute bottom-20 right-2 flex flex-col items-center gap-5">
        <button
          type="button"
          data-ocid="reel_card.like_button"
          aria-label={liked ? "Unlike reel" : "Like reel"}
          onClick={toggleLike}
          className="group flex flex-col items-center gap-1"
        >
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-smooth",
              liked && "bg-accent/90",
            )}
          >
            <Heart
              className={cn(
                "h-6 w-6 transition-smooth",
                liked
                  ? "fill-accent-foreground text-accent-foreground"
                  : "text-white",
              )}
              strokeWidth={2}
            />
          </span>
          <span className="text-xs font-semibold text-white drop-shadow">
            {formatCount(likeCount)}
          </span>
        </button>

        <button
          type="button"
          data-ocid="reel_card.comment_button"
          aria-label="Comment on reel"
          onClick={() => onOpenComments(reel)}
          className="group flex flex-col items-center gap-1"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-smooth group-hover:bg-black/50">
            <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
          </span>
          <span className="text-xs font-semibold text-white drop-shadow">
            {formatCount(reel.comments)}
          </span>
        </button>

        <button
          type="button"
          data-ocid="reel_card.save_button"
          aria-label={saved ? "Remove from saved" : "Save reel"}
          onClick={toggleSave}
          className="group flex flex-col items-center gap-1"
        >
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-smooth",
              saved && "bg-primary/90",
            )}
          >
            <Bookmark
              className={cn(
                "h-6 w-6 transition-smooth",
                saved
                  ? "fill-primary-foreground text-primary-foreground"
                  : "text-white",
              )}
              strokeWidth={2}
            />
          </span>
          <span className="text-xs font-semibold text-white drop-shadow">
            {formatCount(saveCount)}
          </span>
        </button>

        <button
          type="button"
          data-ocid="reel_card.share_button"
          aria-label="Share reel"
          onClick={share}
          className="group flex flex-col items-center gap-1"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-smooth group-hover:bg-black/50">
            <Share2 className="h-6 w-6 text-white" strokeWidth={2} />
          </span>
          <span className="text-xs font-semibold text-white drop-shadow">
            {formatCount(reel.shares)}
          </span>
        </button>
      </div>
    </article>
  );
}
