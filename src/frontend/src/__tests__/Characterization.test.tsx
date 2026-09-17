import { resolveReelVideoUrl } from "@/lib/reel-video";
import { ProfilePage } from "@/pages/ProfilePage";
import { ReelsPage } from "@/pages/ReelsPage";
import { UploadPage } from "@/pages/UploadPage";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALLER, createMockActor, renderWithProviders } from "./test-utils";

/**
 * Characterization baseline for behavior adjacent to the accepted changes:
 * reel video URL resolution and the new Profile status/notes section.
 *
 * These tests deliberately do NOT assert how a reel's video URL is resolved
 * (the current `reel.video.directURL` mapping is the behavior being fixed), and
 * they do not assert anything about statuses/notes. They protect the working
 * Profile, Upload, and Reels behavior that must survive those changes.
 */

const useActorMock = vi.hoisted(() => vi.fn());
const useInternetIdentityMock = vi.hoisted(() => vi.fn());
const useAddReelMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
  useInternetIdentity: useInternetIdentityMock,
}));

vi.mock("@/hooks/useQueries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useQueries")>();
  return {
    ...actual,
    useAddReel: useAddReelMock,
  };
});

const OTHER = "aaaaa-aa";

function backendReel(
  id: bigint,
  caption: string,
  uploaderText: string = CALLER.toText(),
) {
  return {
    id,
    likeCount: 0n,
    commentCount: 0n,
    saveCount: 0n,
    createdAt: 1n,
    filename: "clip.mp4",
    caption,
    uploader: { toText: () => uploaderText },
    video: { directURL: "https://example.com/video.mp4" },
  };
}

function mockAddReel(overrides: Record<string, unknown> = {}) {
  useAddReelMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    ...overrides,
  });
}

describe("Profile tab baseline (adjacent to the new status/notes section)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
      clear: vi.fn(),
    });
  });

  it("links to the settings route from the profile header", async () => {
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue({
      username: "aarav",
      password: "secret",
      createdAt: 1n,
    });
    actor.listReels.mockResolvedValue([]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ProfilePage />);
    const settingsLink = await screen.findByTestId("profile.settings_link");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("shows only the caller's own reels on the uploaded tab", async () => {
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue({
      username: "aarav",
      password: "secret",
      createdAt: 1n,
    });
    actor.listReels.mockResolvedValue([
      backendReel(1n, "Mine", CALLER.toText()),
      backendReel(2n, "Someone else's", OTHER),
    ]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ProfilePage />);
    await screen.findByText("Saved reels");

    await userEvent.click(screen.getByRole("tab", { name: /uploaded/i }));

    expect(screen.getByText("Mine")).toBeInTheDocument();
    expect(screen.queryByText("Someone else's")).not.toBeInTheDocument();
  });

  it("shows the empty state for the uploaded tab when the caller has no reels", async () => {
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue({
      username: "aarav",
      password: "secret",
      createdAt: 1n,
    });
    actor.listReels.mockResolvedValue([backendReel(1n, "Not mine", OTHER)]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ProfilePage />);
    await screen.findByText("Saved reels");

    await userEvent.click(screen.getByRole("tab", { name: /uploaded/i }));
    expect(
      await screen.findByText("No uploaded reels yet"),
    ).toBeInTheDocument();
  });
});

describe("Upload page baseline (adjacent to the reels upload flow)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddReel();
  });

  it("shows an error and keeps submit disabled when the upload fails", async () => {
    const mutate = vi.fn(
      (_payload: unknown, opts?: { onError?: () => void }) => {
        opts?.onError?.();
      },
    );
    mockAddReel({ mutate });

    await renderWithProviders(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId("upload.input"),
      new File(["fake-video-bytes"], "clip.mp4", { type: "video/mp4" }),
    );
    await userEvent.type(screen.getByLabelText(/caption/i), "My first reel");
    await userEvent.click(
      screen.getByRole("button", { name: /publish reel/i }),
    );

    expect(await screen.findByTestId("upload.error_state")).toBeInTheDocument();
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("clears the selected file and disables submit when it is removed", async () => {
    await renderWithProviders(<UploadPage />);
    await userEvent.upload(
      screen.getByTestId("upload.input"),
      new File(["fake-video-bytes"], "clip.mp4", { type: "video/mp4" }),
    );
    await userEvent.type(screen.getByLabelText(/caption/i), "My first reel");

    const submit = screen.getByRole("button", { name: /publish reel/i });
    expect(submit).toBeEnabled();

    await userEvent.click(
      screen.getByRole("button", { name: /remove selected video/i }),
    );

    expect(
      screen.queryByTestId("upload.selected_file"),
    ).not.toBeInTheDocument();
    expect(submit).toBeDisabled();
  });
});

describe("Reels feed baseline (adjacent to video URL resolution)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
    });
  });

  it("shows the error state and retries when the feed fails to load", async () => {
    const actor = createMockActor();
    actor.listReels.mockRejectedValue(new Error("network down"));
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    expect(await screen.findByText("Couldn't load reels")).toBeInTheDocument();

    actor.listReels.mockResolvedValue([backendReel(1n, "Recovered reel")]);
    await userEvent.click(screen.getByTestId("reels.retry_button"));

    await waitFor(() => {
      expect(screen.getByText("Recovered reel")).toBeInTheDocument();
    });
  });

  it("renders each reel's caption and uploader handle in the feed", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([backendReel(1n, "First reel", OTHER)]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.getUserProfile.mockResolvedValue({ username: "ada", isPublic: true });
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    expect(await screen.findByText("First reel")).toBeInTheDocument();
    expect(screen.getByText("@aaaaa-aa")).toBeInTheDocument();
  });
});

describe("reel video URL resolution (the fixed regression)", () => {
  it("resolves a stored blob through getDirectURL rather than its stale directURL", () => {
    // A stored blob's `directURL` is an upload-session `blob:` URL that is
    // meaningless after a reload or for another viewer. Playback must resolve
    // the gateway URL from the stored blob reference instead.
    const storedBlob = {
      directURL: "blob:https://app.example/stale-session-url",
      getDirectURL: () => "https://gateway.example/blob/abc",
    };
    expect(resolveReelVideoUrl(storedBlob)).toBe(
      "https://gateway.example/blob/abc",
    );
  });

  it("falls back to a plain URL string and to an empty string for unknown values", () => {
    expect(resolveReelVideoUrl("https://example.com/video.mp4")).toBe(
      "https://example.com/video.mp4",
    );
    expect(resolveReelVideoUrl(null)).toBe("");
    expect(resolveReelVideoUrl(undefined)).toBe("");
  });

  it("plays a reel uploaded in a previous session from its stored URL after reload", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([
      {
        id: 9n,
        likeCount: 0n,
        commentCount: 0n,
        saveCount: 0n,
        createdAt: 1n,
        filename: "clip.mp4",
        caption: "Reloaded reel",
        uploader: { toText: () => CALLER.toText() },
        // No usable directURL: only the stored blob reference resolves.
        video: {
          directURL: "",
          getDirectURL: () => "https://gateway.example/blob/reloaded",
        },
      },
    ]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    await screen.findByText("Reloaded reel");

    const video = screen.getByTestId("reel_card.video") as HTMLVideoElement;
    expect(video.getAttribute("src")).toBe(
      "https://gateway.example/blob/reloaded",
    );
  });

  it("shows a buffering indicator and a retry control when playback fails", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([backendReel(1n, "Broken reel")]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    await screen.findByText("Broken reel");

    // Before any video data arrives the card shows its loading state.
    expect(screen.getByTestId("reel_card.loading_state")).toBeInTheDocument();

    // A playback failure surfaces the error state with a retry affordance.
    const video = screen.getByTestId("reel_card.video");
    video.dispatchEvent(new Event("error"));

    expect(
      await screen.findByTestId("reel_card.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("reel_card.retry_button")).toBeInTheDocument();

    // Retrying clears the error and returns to the buffering state.
    await userEvent.click(screen.getByTestId("reel_card.retry_button"));
    expect(
      screen.queryByTestId("reel_card.error_state"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("reel_card.loading_state")).toBeInTheDocument();
  });
});
