import { StatusComposer } from "@/components/StatusComposer";
import { StatusList } from "@/components/StatusList";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetCallerProfile,
  useGetUserProfile,
  useListReels,
  useListSavedReels,
  useListStatuses,
} from "@/hooks/useQueries";
import type { Reel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  Clapperboard,
  LogOut,
  PenLine,
  Settings,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";

type ReelTab = "saved" | "uploaded";

function ReelThumb({ reel }: { reel: Reel }) {
  const hasVideo = reel.videoUrl.length > 0;
  return (
    <div
      data-ocid={`profile.reel_item.${reel.id}`}
      className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-muted"
    >
      {hasVideo ? (
        <video
          src={reel.videoUrl}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />
      ) : (
        <div
          data-ocid={`profile.reel_placeholder.${reel.id}`}
          className="flex h-full w-full items-center justify-center bg-gradient-primary/20"
        >
          <Clapperboard className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-subtle px-2 pb-1.5 pt-6">
        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-white">
          {reel.caption}
        </p>
      </div>
    </div>
  );
}

function ReelGrid({
  reels,
  emptyLabel,
}: { reels: Reel[]; emptyLabel: string }) {
  if (reels.length === 0) {
    return (
      <div
        data-ocid="profile.reels_empty_state"
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center"
      >
        <Clapperboard className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-display text-sm font-semibold text-foreground">
          {emptyLabel}
        </p>
        <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
          Reels you save or upload will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {reels.map((reel) => (
        <ReelThumb key={reel.id} reel={reel} />
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { identity, logout } = useAuth();
  const [tab, setTab] = useState<ReelTab>("saved");
  const [composerOpen, setComposerOpen] = useState(false);

  const params = useParams({ strict: false }) as { principal?: string };
  const routePrincipal = params.principal ?? "";

  const { data: profile } = useGetCallerProfile();
  const { data: allReels = [], isLoading: reelsLoading } = useListReels();
  const { data: savedIds = [], isLoading: savedLoading } = useListSavedReels();

  const callerPrincipal = useMemo(
    () => identity?.getPrincipal().toText() ?? "",
    [identity],
  );

  const isOwnProfile =
    routePrincipal === "" || routePrincipal === callerPrincipal;
  const viewedPrincipal = isOwnProfile ? callerPrincipal : routePrincipal;

  const { data: viewedProfile } = useGetUserProfile(
    isOwnProfile ? "" : viewedPrincipal,
  );

  const { data: statuses = [], isLoading: statusesLoading } =
    useListStatuses(viewedPrincipal);

  const principalHandle = useMemo(
    () => (viewedPrincipal ? `@${viewedPrincipal.slice(0, 8)}` : "@you"),
    [viewedPrincipal],
  );

  const displayHandle = useMemo(() => {
    if (isOwnProfile) {
      return profile?.username ? `@${profile.username}` : principalHandle;
    }
    return viewedProfile?.username
      ? `@${viewedProfile.username}`
      : principalHandle;
  }, [isOwnProfile, profile, viewedProfile, principalHandle]);

  const pictureUrl = isOwnProfile
    ? profile?.profilePicture?.getDirectURL()
    : viewedProfile?.profilePicture?.getDirectURL();

  const savedReels = useMemo(
    () => allReels.filter((reel) => savedIds.includes(reel.id)),
    [allReels, savedIds],
  );

  const uploadedReels = useMemo(
    () => allReels.filter((reel) => reel.uploaderPrincipal === viewedPrincipal),
    [allReels, viewedPrincipal],
  );

  const loading = reelsLoading || savedLoading;

  const tabs: {
    id: ReelTab;
    label: string;
    icon: typeof Bookmark;
    count: number;
  }[] = [
    { id: "saved", label: "Saved", icon: Bookmark, count: savedReels.length },
    {
      id: "uploaded",
      label: "Uploaded",
      icon: Upload,
      count: uploadedReels.length,
    },
  ];

  return (
    <div className="px-4 py-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {isOwnProfile ? null : (
          <Link
            to="/reels"
            data-ocid="profile.back_button"
            aria-label="Back to reels"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary font-display text-2xl font-bold text-white shadow-elevated">
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={displayHandle}
              className="h-full w-full object-cover"
            />
          ) : (
            (displayHandle[1] ?? "B").toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold text-foreground">
            {displayHandle}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isOwnProfile ? "Baathchit creator" : "Baathchit member"}
          </p>
        </div>
        {isOwnProfile ? (
          <>
            <Link
              to="/settings"
              data-ocid="profile.settings_link"
              aria-label="Open settings"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              type="button"
              data-ocid="profile.logout_button"
              onClick={logout}
              aria-label="Log out"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-smooth hover:bg-muted hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-display text-2xl font-bold text-foreground">
            {savedReels.length}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Saved reels
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-display text-2xl font-bold text-foreground">
            {uploadedReels.length}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Uploaded reels
          </p>
        </div>
      </div>

      {/* Status & Notes */}
      <section data-ocid="profile.status_section" className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold text-foreground">
              Status &amp; Notes
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {statuses.length === 0
                ? isOwnProfile
                  ? "Share a quick update with your followers"
                  : "No updates shared yet"
                : `${statuses.length} ${statuses.length === 1 ? "post" : "posts"}`}
            </p>
          </div>
          {isOwnProfile ? (
            <button
              type="button"
              data-ocid="profile.compose_status_button"
              aria-expanded={composerOpen}
              onClick={() => setComposerOpen((open) => !open)}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:opacity-90"
            >
              <PenLine className="h-4 w-4" />
              {composerOpen ? "Close" : "New post"}
            </button>
          ) : null}
        </div>

        {isOwnProfile && composerOpen ? (
          <div className="mt-3">
            <StatusComposer onPosted={() => setComposerOpen(false)} />
          </div>
        ) : null}

        <div className="mt-3">
          <StatusList
            statuses={statuses}
            isLoading={statusesLoading}
            currentPrincipal={callerPrincipal}
            canDelete={isOwnProfile}
            emptyMessage={
              isOwnProfile
                ? "No statuses or notes yet"
                : `${displayHandle} hasn't posted a status yet`
            }
          />
        </div>
      </section>

      {/* Tabs */}
      <div
        data-ocid="profile.tabs"
        role="tablist"
        aria-label="Your reels"
        className="mt-6 flex gap-1 rounded-full border border-border bg-card p-1"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            data-ocid={`profile.tab.${item.id}`}
            onClick={() => setTab(item.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-smooth",
              tab === item.id
                ? "bg-primary text-primary-foreground shadow-reel-rail"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            <span className="text-xs opacity-80">{item.count}</span>
          </button>
        ))}
      </div>

      {/* Reel content */}
      <div className="mt-4">
        {loading ? (
          <div
            data-ocid="profile.loading_state"
            className="grid grid-cols-3 gap-2"
            aria-label="Loading your reels"
          >
            {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((id) => (
              <div
                key={id}
                className="aspect-[9/16] animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : tab === "saved" ? (
          <ReelGrid reels={savedReels} emptyLabel="No saved reels yet" />
        ) : (
          <ReelGrid reels={uploadedReels} emptyLabel="No uploaded reels yet" />
        )}
      </div>
    </div>
  );
}
