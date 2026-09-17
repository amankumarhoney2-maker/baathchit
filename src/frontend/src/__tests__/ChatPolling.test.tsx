import { useListConversations, useListMessages } from "@/hooks/useQueries";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockActor } from "./test-utils";

const useActorMock = vi.hoisted(() => vi.fn());
const createActorMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
}));

vi.mock("@/backend", () => ({
  createActor: createActorMock,
}));

// A probe that mounts the real chat query hook and hands the test the
// QueryClient so it can inspect the configured polling options.
let capturedClient: QueryClient | undefined;
function ChatPollingProbe() {
  useListConversations();
  capturedClient = useQueryClient();
  return null;
}

// A probe for the messages query, which previously used a BigInt query key that
// React Query's default hashKey could not serialize. The fix switched the key to
// conversationId.toString(), so the query should now be cacheable and poll.
let capturedMessagesClient: QueryClient | undefined;
function MessagesPollingProbe({ conversationId }: { conversationId: bigint }) {
  useListMessages(conversationId);
  capturedMessagesClient = useQueryClient();
  return null;
}

describe("chat near-real-time polling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedClient = undefined;
    const actor = createMockActor();
    actor.listConversations.mockResolvedValue([]);
    actor.listMessages.mockResolvedValue([]);
    useActorMock.mockReturnValue({ actor, isFetching: false });
    createActorMock.mockReturnValue(actor);
  });

  it("configures periodic refresh for the conversations list", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ChatPollingProbe />
      </QueryClientProvider>,
    );

    const conversationsQuery = capturedClient!
      .getQueryCache()
      .findAll()
      .find((q) => q.queryKey[0] === "conversations");

    // The requirement is that chat refreshes in near real time via periodic
    // refresh. Assert that polling is enabled (a positive interval) rather than
    // freezing the exact interval value, which is a tuning detail that may
    // change.
    expect(conversationsQuery).toBeDefined();
    const options = conversationsQuery!.options as { refetchInterval?: number };
    expect(options.refetchInterval).toBeGreaterThan(0);
  });

  it("configures periodic refresh for the messages list with a serializable query key", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MessagesPollingProbe conversationId={42n} />
      </QueryClientProvider>,
    );

    // The BigInt query-key serialization fix means the messages query is now
    // cacheable: it must appear in the cache under a string key rather than
    // throwing during hashing.
    const messagesQuery = capturedMessagesClient!
      .getQueryCache()
      .findAll()
      .find((q) => q.queryKey[0] === "messages");

    expect(messagesQuery).toBeDefined();
    expect(messagesQuery!.queryKey[1]).toBe("42");

    // Messages refresh in near real time via periodic polling.
    const options = messagesQuery!.options as { refetchInterval?: number };
    expect(options.refetchInterval).toBeGreaterThan(0);
  });
});
