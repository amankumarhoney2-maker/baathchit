import { BottomNav } from "@/components/BottomNav";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      "data-ocid": ocid,
    }: {
      children:
        | React.ReactNode
        | ((args: { isActive: boolean }) => React.ReactNode);
      to: string;
      "data-ocid"?: string;
    }) => (
      <a href={to} data-ocid={ocid}>
        {typeof children === "function"
          ? children({ isActive: false })
          : children}
      </a>
    ),
  };
});

describe("BottomNav", () => {
  it("renders navigation links for Reels, Chats, Profile, and Upload", () => {
    render(<BottomNav />);
    expect(screen.getByText("Reels")).toBeInTheDocument();
    expect(screen.getByText("Chats")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("links to the correct routes", () => {
    render(<BottomNav />);
    expect(screen.getByText("Reels").closest("a")).toHaveAttribute(
      "href",
      "/reels",
    );
    expect(screen.getByText("Chats").closest("a")).toHaveAttribute(
      "href",
      "/chats",
    );
    expect(screen.getByText("Profile").closest("a")).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByText("Upload").closest("a")).toHaveAttribute(
      "href",
      "/upload",
    );
  });
});
