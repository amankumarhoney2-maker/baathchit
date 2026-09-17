import { ProfilePage } from "@/pages/ProfilePage";
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
    likeCount: 0n,
    commentCount: 0n,
    saveCount: 0n,
    createdAt: 1n,
    filename: "clip.mp4",
    caption,
    uploader: { toText: () => CALLER.toText() },
    video: { directURL: "https://example.com/video.mp4" },
  };
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
      clear: vi.fn(),
    });
  });

  it("shows the username from the caller profile", async () => {
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
    expect(await screen.findByText("@aarav")).toBeInTheDocument();
  });

  it("shows saved and uploaded reel counts", async () => {
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue({
      username: "aarav",
      password: "secret",
      createdAt: 1n,
    });
    actor.listReels.mockResolvedValue([backendReel(1n, "My reel")]);
    actor.listSavedReels.mockResolvedValue([{ reelId: 1n, savedAt: 1n }]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ProfilePage />);
    expect(await screen.findByText("My reel")).toBeInTheDocument();
    expect(screen.getByText("Saved reels")).toBeInTheDocument();
    expect(screen.getByText("Uploaded reels")).toBeInTheDocument();
  });

  it("switches between saved and uploaded tabs", async () => {
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue({
      username: "aarav",
      password: "secret",
      createdAt: 1n,
    });
    actor.listReels.mockResolvedValue([backendReel(1n, "My reel")]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ProfilePage />);
    // Saved tab is empty.
    expect(await screen.findByText("No saved reels yet")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /uploaded/i }));
    expect(screen.getByText("My reel")).toBeInTheDocument();
  });

  it("calls logout when the logout button is clicked", async () => {
    const clear = vi.fn();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
      clear,
    });
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue(null);
    actor.listReels.mockResolvedValue([]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ProfilePage />);
    await userEvent.click(
      await screen.findByRole("button", { name: /log out/i }),
    );
    expect(clear).toHaveBeenCalled();
  });
});

describe("ProfilePage status & notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
      clear: vi.fn(),
    });
  });

  function mockProfile(overrides: Record<string, unknown> = {}) {
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue({
      username: "aarav",
      password: "secret",
      createdAt: 1n,
    });
    actor.listReels.mockResolvedValue([]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.listStatusesByAuthor.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });
    return { actor, ...overrides };
  }

  it("exposes a compose entry point and posts a text status from the profile tab", async () => {
    const { actor } = mockProfile();
    actor.addStatus.mockResolvedValue({
      id: 1n,
      author: CALLER,
      text: "Hello world",
      image: undefined,
      createdAt: 1n,
    });

    await renderWithProviders(<ProfilePage />);
    await screen.findByText("@aarav");

    await userEvent.click(screen.getByTestId("profile.compose_status_button"));
    const textarea = await screen.findByTestId("status.textarea");
    await userEvent.type(textarea, "Hello world");
    await userEvent.click(screen.getByTestId("status.submit_button"));

    await waitFor(() => {
      expect(actor.addStatus).toHaveBeenCalledWith("Hello world", null);
    });
  });

  it("renders statuses newest first with author, timestamp, and image", async () => {
    const { actor } = mockProfile();
    actor.listStatusesByAuthor.mockResolvedValue([
      {
        id: 2n,
        author: CALLER,
        text: "Newest note",
        image: { getDirectURL: () => "https://example.com/new.png" },
        createdAt: 2_000_000_000n,
      },
      {
        id: 1n,
        author: CALLER,
        text: "Older note",
        image: undefined,
        createdAt: 1_000_000_000n,
      },
    ]);

    await renderWithProviders(<ProfilePage />);

    const items = await screen.findAllByTestId(/^status\.item\./);
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Newest note");
    expect(items[1]).toHaveTextContent("Older note");
    // Both statuses share the same author, so scope the handle assertion to the
    // first item rather than matching every rendered author label.
    expect(items[0]).toHaveTextContent("@2vxsx-fa");
    expect(screen.getByTestId("status.image.1")).toHaveAttribute(
      "src",
      "https://example.com/new.png",
    );
  });

  it("deletes the caller's own status and removes it from the list", async () => {
    const { actor } = mockProfile();
    actor.listStatusesByAuthor.mockResolvedValue([
      {
        id: 7n,
        author: CALLER,
        text: "Delete me",
        image: undefined,
        createdAt: 1n,
      },
    ]);
    actor.deleteStatus.mockResolvedValue(undefined);

    await renderWithProviders(<ProfilePage />);
    await screen.findByText("Delete me");

    await userEvent.click(screen.getByTestId("status.delete_button.1"));

    await waitFor(() => {
      expect(actor.deleteStatus).toHaveBeenCalledWith(7n);
    });
  });

  it("shows another user's statuses without delete controls", async () => {
    const OTHER = "aaaaa-aa";
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue({
      username: "aarav",
      password: "secret",
      createdAt: 1n,
    });
    actor.listReels.mockResolvedValue([]);
    actor.listSavedReels.mockResolvedValue([]);
    actor.listLikedReels.mockResolvedValue([]);
    actor.getUserProfile.mockResolvedValue({
      username: "ada",
      isPublic: true,
    });
    actor.listStatusesByAuthor.mockResolvedValue([
      {
        id: 3n,
        author: { toText: () => OTHER },
        text: "Ada's update",
        image: undefined,
        createdAt: 1n,
      },
    ]);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<ProfilePage />, `/profile/${OTHER}`);

    expect(await screen.findByText("Ada's update")).toBeInTheDocument();
    expect(
      screen.queryByTestId("status.delete_button.1"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("profile.compose_status_button"),
    ).not.toBeInTheDocument();
  });
});
