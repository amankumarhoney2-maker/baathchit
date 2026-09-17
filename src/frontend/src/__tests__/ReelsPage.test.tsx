import { ReelsPage } from "@/pages/ReelsPage";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALLER, createMockActor, renderWithProviders } from "./test-utils";

const useActorMock = vi.hoisted(() => vi.fn());
const useInternetIdentityMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
  useInternetIdentity: useInternetIdentityMock,
}));

function backendReel(id: bigint, caption: string) {
  return {
    id,
    likeCount: 2n,
    commentCount: 1n,
    saveCount: 0n,
    createdAt: 1n,
    filename: "clip.mp4",
    caption,
    uploader: { toText: () => "aaaaa-aa" },
    video: { directURL: "https://example.com/video.mp4" },
  };
}

describe("ReelsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
    });
  });

  it("renders the feed with reels from the backend", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([backendReel(1n, "First reel")]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.getUserProfile.mockResolvedValue({ username: "ada", isPublic: true });
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    expect(await screen.findByText("First reel")).toBeInTheDocument();
    expect(screen.getByText("@aaaaa-aa")).toBeInTheDocument();
  });

  it("renders the feed as a vertical full-screen scrollable list", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([
      backendReel(1n, "First reel"),
      backendReel(2n, "Second reel"),
    ]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.getUserProfile.mockResolvedValue({ username: "ada", isPublic: true });
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    await screen.findByText("First reel");

    const feed = screen.getByTestId("reels.feed");
    // The feed is a vertical, snap-scrolling container so each reel fills the
    // viewport and the user scrolls between full-screen reels.
    expect(feed.className).toContain("snap-y");
    expect(feed.className).toContain("overflow-y-scroll");

    // Each reel occupies a full viewport-height snap slot.
    const firstItem = screen.getByTestId("reels.item.1");
    const secondItem = screen.getByTestId("reels.item.2");
    expect(firstItem.className).toContain("h-full");
    expect(firstItem.className).toContain("w-full");
    expect(firstItem.className).toContain("snap-start");
    expect(secondItem.className).toContain("h-full");
    expect(secondItem.className).toContain("w-full");
  });

  it("shows the empty state when there are no reels", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });
    await renderWithProviders(<ReelsPage />);
    expect(await screen.findByText("No reels yet")).toBeInTheDocument();
  });

  it("likes a reel via the backend when the like button is clicked", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([backendReel(1n, "First reel")]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.likeReel.mockResolvedValue(undefined);
    actor.getUserProfile.mockResolvedValue({ username: "ada", isPublic: true });
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    const likeButton = await screen.findByRole("button", {
      name: /like reel/i,
    });
    await userEvent.click(likeButton);
    await waitFor(() => {
      expect(actor.likeReel).toHaveBeenCalledWith(1n);
    });
  });

  it("saves a reel via the backend when the save button is clicked", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([backendReel(1n, "First reel")]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.saveReel.mockResolvedValue(undefined);
    actor.getUserProfile.mockResolvedValue({ username: "ada", isPublic: true });
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    const saveButton = await screen.findByRole("button", {
      name: /save reel/i,
    });
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(actor.saveReel).toHaveBeenCalledWith(1n);
    });
  });

  it("opens the comment sheet and posts a comment", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([backendReel(1n, "First reel")]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.listComments.mockResolvedValue([]);
    actor.addComment.mockResolvedValue({});
    actor.getUserProfile.mockResolvedValue({ username: "ada", isPublic: true });
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ReelsPage />);
    const commentButton = await screen.findByRole("button", {
      name: /comment on reel/i,
    });
    await userEvent.click(commentButton);

    const input = await screen.findByLabelText(/add a comment/i);
    await userEvent.type(input, "Nice reel!");
    await userEvent.click(
      screen.getByRole("button", { name: /post comment/i }),
    );

    await waitFor(() => {
      expect(actor.addComment).toHaveBeenCalledWith(1n, "Nice reel!");
    });
  });

  it("lazy-loads and autoplays only the reel currently in view", async () => {
    const actor = createMockActor();
    actor.listReels.mockResolvedValue([
      backendReel(1n, "First reel"),
      backendReel(2n, "Second reel"),
    ]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.getUserProfile.mockResolvedValue({ username: "ada", isPublic: true });
    useActorMock.mockReturnValue({ actor, isFetching: false });

    // jsdom's `HTMLMediaElement.paused` is a read-only property that does not
    // reflect play()/pause() calls, so observe the calls the component makes
    // instead. Install the spies before render to capture the initial autoplay.
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause");

    await renderWithProviders(<ReelsPage />);
    await screen.findByText("First reel");

    const videos = screen.getAllByTestId(
      "reel_card.video",
    ) as HTMLVideoElement[];

    // Every reel keeps a resolved source so playback can start immediately when
    // it scrolls into view, but only the reel currently in view is eager: the
    // active reel preloads its data and autoplays, while the off-screen reel
    // preloads nothing and is never played.
    expect(videos[0].getAttribute("src")).toBe("https://example.com/video.mp4");
    expect(videos[0].getAttribute("preload")).toBe("auto");
    expect(videos[1].getAttribute("src")).toBe("https://example.com/video.mp4");
    expect(videos[1].getAttribute("preload")).toBe("metadata");
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.instances[0]).toBe(videos[0]);
    // The off-screen reel is explicitly paused on mount.
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(pauseSpy.mock.instances[0]).toBe(videos[1]);

    // Simulate the second reel scrolling into view via the IntersectionObserver
    // stub. The active reel switches, so the second video becomes eager and the
    // first is paused.
    const observer = (
      globalThis as unknown as {
        IntersectionObserver: {
          instances: Array<{
            trigger: (target: Element, isIntersecting: boolean) => void;
            observedElements: Element[];
          }>;
        };
      }
    ).IntersectionObserver.instances.at(-1)!;

    const secondItem = screen.getByTestId("reels.item.2");
    observer.trigger(secondItem, true);

    await waitFor(() => {
      expect(
        (
          screen.getAllByTestId("reel_card.video")[1] as HTMLVideoElement
        ).getAttribute("preload"),
      ).toBe("auto");
    });
    expect(playSpy.mock.instances.at(-1)).toBe(
      screen.getAllByTestId("reel_card.video")[1],
    );
    expect(pauseSpy.mock.instances.at(-1)).toBe(
      screen.getAllByTestId("reel_card.video")[0],
    );

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });
});
