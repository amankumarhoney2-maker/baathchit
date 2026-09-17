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

it("opens the emoji picker from the Add emoji button", async () => {
  useParamsMock.mockReturnValue({ conversationId: "1" });
  useInternetIdentityMock.mockReturnValue({
    identity: { getPrincipal: () => CALLER },
  });
  useSendMessageMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useReactToMessageMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useGetUserProfileMock.mockReturnValue({
    data: { username: "peer", isPublic: true },
  });
  useListMessagesMock.mockReturnValue({ data: [], isLoading: false });

  await renderWithProviders(<ChatRoomPage />);
  // The emoji picker lives in a Radix Popover portal. In jsdom the portal
  // content has no layout, so userEvent's pointer-coordinate resolution does
  // not open the trigger; fireEvent dispatches the click directly instead.
  // The content mounts synchronously, so a plain getByRole resolves without
  // waiting.
  fireEvent.click(await screen.findByRole("button", { name: /add emoji/i }));

  // The popover content mounts and exposes the emoji options.
  expect(
    screen.getByRole("button", { name: /react with ❤️/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /react with 👍/i }),
  ).toBeInTheDocument();
});
