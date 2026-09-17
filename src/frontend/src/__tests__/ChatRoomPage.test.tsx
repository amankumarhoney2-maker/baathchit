import { ChatRoomPage } from "@/pages/ChatRoomPage";
import { Principal } from "@icp-sdk/core/principal";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALLER, renderWithProviders } from "./test-utils";

const useInternetIdentityMock = vi.hoisted(() => vi.fn());
const useParamsMock = vi.hoisted(() => vi.fn());
const useListMessagesMock = vi.hoisted(() => vi.fn());
const useSendMessageMock = vi.hoisted(() => vi.fn());
const useReactToMessageMock = vi.hoisted(() => vi.fn());
const useGetUserProfileMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: vi.fn(),
  useInternetIdentity: useInternetIdentityMock,
}));

vi.mock("@/hooks/useQueries", () => ({
  useListMessages: useListMessagesMock,
  useSendMessage: useSendMessageMock,
  useReactToMessage: useReactToMessageMock,
  useGetUserProfile: useGetUserProfileMock,
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useParams: useParamsMock,
    Link: ({ children }: { children: React.ReactNode }) => (
      <a href="/">{children}</a>
    ),
  };
});

const PEER = Principal.fromText("aaaaa-aa");

function message(id: bigint, text: string, sender: Principal) {
  return {
    id,
    conversationId: 1n,
    sender,
    text,
    replyTo: undefined,
    reactions: [],
    createdAt: 1n,
  };
}

function mockSendMessage(overrides: Record<string, unknown> = {}) {
  useSendMessageMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    ...overrides,
  });
}

function mockReactToMessage(overrides: Record<string, unknown> = {}) {
  useReactToMessageMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    ...overrides,
  });
}

describe("ChatRoomPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useParamsMock.mockReturnValue({ conversationId: "1" });
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
    });
    useGetUserProfileMock.mockReturnValue({
      data: { username: "peer", isPublic: true },
    });
    mockSendMessage();
    mockReactToMessage();
  });

  it("shows the empty state when there are no messages", async () => {
    useListMessagesMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    await renderWithProviders(<ChatRoomPage />);
    expect(await screen.findByText("Say hello")).toBeInTheDocument();
  });

  it("renders messages from the conversation", async () => {
    useListMessagesMock.mockReturnValue({
      data: [message(1n, "Hello there", PEER), message(2n, "Hi back", CALLER)],
      isLoading: false,
    });

    await renderWithProviders(<ChatRoomPage />);
    expect(await screen.findByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("Hi back")).toBeInTheDocument();
  });

  it("sends a message via the backend", async () => {
    const mutate = vi.fn();
    mockSendMessage({ mutate });
    useListMessagesMock.mockReturnValue({ data: [], isLoading: false });

    await renderWithProviders(<ChatRoomPage />);
    const input = await screen.findByPlaceholderText(/type message/i);
    await userEvent.type(input, "hello friend");
    await userEvent.click(
      screen.getByRole("button", { name: /send message/i }),
    );

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        { conversationId: 1n, text: "hello friend", replyTo: undefined },
        expect.anything(),
      );
    });
  });

  it("appends an emoji to the draft when one is selected", async () => {
    vi.useFakeTimers();
    try {
      useListMessagesMock.mockReturnValue({ data: [], isLoading: false });

      await renderWithProviders(<ChatRoomPage />);
      // The emoji picker lives in a Radix Popover portal. In jsdom the portal
      // content has no layout, so userEvent's pointer-coordinate resolution
      // neither opens the trigger nor hits the intended emoji button; fireEvent
      // dispatches the click directly on the element instead. The content mounts
      // synchronously, so a plain getByRole resolves without waiting.
      fireEvent.click(screen.getByRole("button", { name: /add emoji/i }));
      fireEvent.click(screen.getByRole("button", { name: /react with ❤️/i }));

      const input = screen.getByPlaceholderText(/type message/i);
      expect(input).toHaveValue("❤️");

      // Closing the popover schedules a Radix exit-animation timer. Under real
      // timers it fires ~1s later and leaks a live handle into the next test,
      // which then times out even after its own body completes. Advance the
      // fake clock so the timer fires and is cleared before the test ends.
      vi.advanceTimersByTime(2000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reacts to a message via the backend", async () => {
    vi.useFakeTimers();
    try {
      const mutate = vi.fn();
      mockReactToMessage({ mutate });
      useListMessagesMock.mockReturnValue({
        data: [message(1n, "Hello there", PEER)],
        isLoading: false,
      });

      await renderWithProviders(<ChatRoomPage />);
      const reactButton = screen.getByRole("button", {
        name: /react to message/i,
      });
      // Opening the reaction popover mounts a Radix Popover portal whose content
      // has no layout in jsdom; userEvent's pointer-coordinate resolution neither
      // settles the open animation nor hits the intended emoji button, so fireEvent
      // dispatches the clicks directly. The content mounts synchronously, so a
      // plain getByRole resolves without waiting.
      fireEvent.click(reactButton);
      fireEvent.click(screen.getByRole("button", { name: /react with 👍/i }));

      // The mutation is dispatched synchronously from the emoji click handler, so
      // the assertion is reliable without waitFor. Fake timers keep the chat
      // room's polling refresh and any Radix popover timers from leaking a live
      // handle that would otherwise time the test out after the body completes.
      expect(mutate).toHaveBeenCalledWith({
        conversationId: 1n,
        messageId: 1n,
        emoji: "👍",
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
