import { ChatsPage } from "@/pages/ChatsPage";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALLER, renderWithProviders } from "./test-utils";

const useInternetIdentityMock = vi.hoisted(() => vi.fn());
const useListConversationsMock = vi.hoisted(() => vi.fn());
const useGetOrCreateConversationMock = vi.hoisted(() => vi.fn());
const useGetUserProfileMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: vi.fn(),
  useInternetIdentity: useInternetIdentityMock,
}));

vi.mock("@/hooks/useQueries", () => ({
  useListConversations: useListConversationsMock,
  useGetOrCreateConversation: useGetOrCreateConversationMock,
  useGetUserProfile: useGetUserProfileMock,
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => (
      <a href="/">{children}</a>
    ),
  };
});

const PEER = Principal.fromText("aaaaa-aa");

function conversation(id: bigint) {
  return {
    id,
    participantA: CALLER,
    participantB: PEER,
    createdAt: 1n,
  };
}

function mockGetOrCreate(overrides: Record<string, unknown> = {}) {
  useGetOrCreateConversationMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    ...overrides,
  });
}

describe("ChatsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
    });
    useGetUserProfileMock.mockReturnValue({
      data: { username: "peer", isPublic: true },
    });
    mockGetOrCreate();
  });

  it("shows the empty state when there are no conversations", async () => {
    useListConversationsMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    await renderWithProviders(<ChatsPage />);
    expect(await screen.findByText("No chats yet")).toBeInTheDocument();
  });

  it("lists conversations with the peer's display name", async () => {
    useListConversationsMock.mockReturnValue({
      data: [conversation(1n)],
      isLoading: false,
    });

    await renderWithProviders(<ChatsPage />);
    expect(await screen.findByText("aaaaa-aa")).toBeInTheDocument();
  });

  it("rejects starting a chat with yourself", async () => {
    useListConversationsMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    await renderWithProviders(<ChatsPage />);
    await userEvent.click(screen.getByRole("button", { name: /new chat/i }));

    const input = await screen.findByPlaceholderText(
      /other user's principal id/i,
    );
    await userEvent.type(input, CALLER.toText());
    await userEvent.click(screen.getByRole("button", { name: /start chat/i }));

    expect(
      await screen.findByText(/can't start a chat with yourself/i),
    ).toBeInTheDocument();
  });

  it("creates a conversation with a valid peer principal", async () => {
    const mutate = vi.fn();
    mockGetOrCreate({ mutate });
    useListConversationsMock.mockReturnValue({
      data: [],
      isLoading: false,
    });

    await renderWithProviders(<ChatsPage />);
    await userEvent.click(screen.getByRole("button", { name: /new chat/i }));

    const input = await screen.findByPlaceholderText(
      /other user's principal id/i,
    );
    await userEvent.type(input, PEER.toText());
    await userEvent.click(screen.getByRole("button", { name: /start chat/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(PEER, expect.anything());
    });
  });
});
