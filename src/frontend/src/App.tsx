import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { ChatRoomPage } from "@/pages/ChatRoomPage";
import { ChatsPage } from "@/pages/ChatsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ReelsPage } from "@/pages/ReelsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UploadPage } from "@/pages/UploadPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

const rootRoute = createRootRoute({
  component: Root,
});

function Root() {
  return <Outlet />;
}

function IndexRedirect() {
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing) return;
    void navigate({ to: isAuthenticated ? "/reels" : "/onboarding" });
  }, [isAuthenticated, isInitializing, navigate]);

  return null;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRedirect,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: OnboardingPage,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});

const reelsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reels",
  component: ReelsPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/upload",
  component: UploadPage,
});

const chatsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/chats",
  component: ChatsPage,
});

const chatRoomRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/chats/$conversationId",
  component: ChatRoomPage,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const userProfileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/profile/$principal",
  component: ProfilePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  onboardingRoute,
  layoutRoute.addChildren([
    reelsRoute,
    uploadRoute,
    chatsRoute,
    chatRoomRoute,
    profileRoute,
    userProfileRoute,
    settingsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
