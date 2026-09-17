import type { Tab } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Clapperboard, MessageCircle, Plus, User } from "lucide-react";

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof Clapperboard;
  to: string;
}

const navItems: NavItem[] = [
  { id: "reels", label: "Reels", icon: Clapperboard, to: "/reels" },
  { id: "chats", label: "Chats", icon: MessageCircle, to: "/chats" },
  { id: "profile", label: "Profile", icon: User, to: "/profile" },
];

export function BottomNav() {
  return (
    <nav
      data-ocid="bottom_nav"
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {navItems.slice(0, 1).map((item) => (
          <Link
            key={item.id}
            to={item.to}
            data-ocid={`bottom_nav.${item.id}`}
            className="group flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex h-9 w-14 items-center justify-center rounded-full transition-smooth",
                    isActive && "bg-primary/15 shadow-reel-rail",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-6 w-6 transition-smooth",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </Link>
        ))}

        <Link
          to="/upload"
          data-ocid="bottom_nav.upload"
          aria-label="Upload a new reel"
          className="group flex flex-1 flex-col items-center justify-center gap-0.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elevated transition-smooth group-hover:scale-105">
            <Plus className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Upload
          </span>
        </Link>

        {navItems.slice(1).map((item) => (
          <Link
            key={item.id}
            to={item.to}
            data-ocid={`bottom_nav.${item.id}`}
            className="group flex flex-1 flex-col items-center justify-center gap-0.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex h-9 w-14 items-center justify-center rounded-full transition-smooth",
                    isActive && "bg-primary/15 shadow-reel-rail",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-6 w-6 transition-smooth",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-smooth",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
