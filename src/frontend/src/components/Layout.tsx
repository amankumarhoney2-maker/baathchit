import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export function Layout() {
  const { isAuthenticated, isInitializing } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      void navigate({ to: "/onboarding" });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  if (isInitializing || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <span className="font-display text-xl font-bold tracking-tight text-gradient">
            Baathchit
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
