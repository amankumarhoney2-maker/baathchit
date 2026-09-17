import { ChatRoomPage } from "@/pages/ChatRoomPage";
import { Principal } from "@icp-sdk/core/principal";
import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
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

it("debug react flow fireEvent", async () => {
  useParamsMock.mockReturnValue({ conversationId: "1" });
  useInternetIdentityMock.mockReturnValue({
    identity: { getPrincipal: () => CALLER },
  });
  useSendMessageMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
  const mutate = vi.fn();
  useReactToMessageMock.mockReturnValue({ mutate, isPending: false });
  useGetUserProfileMock.mockReturnValue({
    data: { username: "peer", isPublic: true },
  });
  useListMessagesMock.mockReturnValue({
    data: [message(1n, "Hello there", PEER)],
    isLoading: false,
  });

  await renderWithProviders(<ChatRoomPage />);
  const reactBtn = await screen.findByRole("button", {
    name: /react to message/i,
  });
  fireEvent.click(reactBtn);
  const thumbsBtn = await screen.findByRole("button", {
    name: /react with 👍/i,
  });
  fireEvent.click(thumbsBtn);
  console.log("MUTATE EMOJI:", mutate.mock.calls[0]?.[0]?.emoji);
  expect(true).toBe(true);
});
