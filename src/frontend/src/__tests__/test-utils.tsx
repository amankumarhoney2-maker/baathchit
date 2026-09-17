import { Principal } from "@icp-sdk/core/principal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

/** A minimal typed actor surface matching the methods the app's hooks call. */
export interface MockActor {
  listReels: ReturnType<typeof vi.fn>;
  listSavedReels: ReturnType<typeof vi.fn>;
  listLikedReels: ReturnType<typeof vi.fn>;
  listComments: ReturnType<typeof vi.fn>;
  likeReel: ReturnType<typeof vi.fn>;
  unlikeReel: ReturnType<typeof vi.fn>;
  saveReel: ReturnType<typeof vi.fn>;
  unsaveReel: ReturnType<typeof vi.fn>;
  addComment: ReturnType<typeof vi.fn>;
  addReel: ReturnType<typeof vi.fn>;
  getCallerProfile: ReturnType<typeof vi.fn>;
  getUserProfile: ReturnType<typeof vi.fn>;
  isUsernameAvailable: ReturnType<typeof vi.fn>;
  registerUser: ReturnType<typeof vi.fn>;
  listConversations: ReturnType<typeof vi.fn>;
  getOrCreateConversation: ReturnType<typeof vi.fn>;
  listMessages: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  reactToMessage: ReturnType<typeof vi.fn>;
  listStatusesByAuthor: ReturnType<typeof vi.fn>;
  addStatus: ReturnType<typeof vi.fn>;
  deleteStatus: ReturnType<typeof vi.fn>;
}

export function createMockActor(): MockActor {
  return {
    listReels: vi.fn(),
    listSavedReels: vi.fn(),
    listLikedReels: vi.fn(),
    listComments: vi.fn(),
    likeReel: vi.fn(),
    unlikeReel: vi.fn(),
    saveReel: vi.fn(),
    unsaveReel: vi.fn(),
    addComment: vi.fn(),
    addReel: vi.fn(),
    getCallerProfile: vi.fn(),
    getUserProfile: vi.fn(),
    isUsernameAvailable: vi.fn(),
    registerUser: vi.fn(),
    listConversations: vi.fn(),
    getOrCreateConversation: vi.fn(),
    listMessages: vi.fn(),
    sendMessage: vi.fn(),
    reactToMessage: vi.fn(),
    listStatusesByAuthor: vi.fn(),
    addStatus: vi.fn(),
    deleteStatus: vi.fn(),
  };
}

export const CALLER = Principal.fromText("2vxsx-fae");

/**
 * The app's pages call `useParams`/`Link` from `@tanstack/react-router`, which
 * require a live router context. Rendering a page bare throws
 * "Cannot read properties of null (reading '__store')". Mount the page inside a
 * minimal memory router so the real router hooks resolve; `initialPath` lets a
 * test exercise the `/profile/$principal` route.
 */
export async function renderWithProviders(ui: ReactNode, initialPath = "/") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const rootRoute = createRootRoute();
  const pageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{ui}</>,
  });
  const principalRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile/$principal",
    component: () => <>{ui}</>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute, principalRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  // `RouterProvider` renders nothing until the router has resolved its initial
  // match, and `router.load()` resolves asynchronously. Await it before
  // rendering so the page is on screen for the first assertion, exactly as the
  // pre-router tests saw it.
  await router.load();

  return {
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}
