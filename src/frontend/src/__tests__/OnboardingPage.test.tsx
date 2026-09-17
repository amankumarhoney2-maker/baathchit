import { OnboardingPage } from "@/pages/OnboardingPage";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALLER, createMockActor, renderWithProviders } from "./test-utils";

const useActorMock = vi.hoisted(() => vi.fn());
const useInternetIdentityMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: useActorMock,
  useInternetIdentity: useInternetIdentityMock,
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function mockAuth(overrides: Record<string, unknown> = {}) {
  useInternetIdentityMock.mockReturnValue({
    identity: { getPrincipal: () => CALLER },
    login: vi.fn(),
    clear: vi.fn(),
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    isLoginError: false,
    loginError: undefined,
    ...overrides,
  });
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue(null);
    actor.isUsernameAvailable.mockResolvedValue(true);
    actor.registerUser.mockResolvedValue(true);
    useActorMock.mockReturnValue({ actor, isFetching: false });
  });

  it("shows the Google sign-in card when unauthenticated", async () => {
    mockAuth({ isAuthenticated: false });
    await renderWithProviders(<OnboardingPage />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("calls login with the google provider when the sign-in button is clicked", async () => {
    const login = vi.fn();
    mockAuth({ isAuthenticated: false, login });
    await renderWithProviders(<OnboardingPage />);
    await userEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );
    expect(login).toHaveBeenCalledWith({ provider: "google" });
  });

  it("shows the setup form for an authenticated user without a profile", async () => {
    mockAuth({ isAuthenticated: true });
    await renderWithProviders(<OnboardingPage />);
    expect(await screen.findByLabelText(/username/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("validates username and password before enabling submit", async () => {
    mockAuth({ isAuthenticated: true });
    await renderWithProviders(<OnboardingPage />);

    const username = await screen.findByLabelText(/username/i);
    const password = screen.getByLabelText(/^password$/i);
    const confirm = screen.getByLabelText(/confirm password/i);
    const submit = screen.getByRole("button", { name: /create account/i });

    // Invalid username (uppercase) and short password keep submit disabled.
    await userEvent.type(username, "BadName");
    await userEvent.type(password, "short");
    await userEvent.type(confirm, "short");
    expect(submit).toBeDisabled();

    // Fix username and password; submit becomes enabled.
    await userEvent.clear(username);
    await userEvent.type(username, "good_name");
    await userEvent.clear(password);
    await userEvent.type(password, "longenough");
    await userEvent.clear(confirm);
    await userEvent.type(confirm, "longenough");
    expect(submit).toBeEnabled();
  });

  it("registers the user with username and password on submit", async () => {
    mockAuth({ isAuthenticated: true });
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue(null);
    actor.isUsernameAvailable.mockResolvedValue(true);
    actor.registerUser.mockResolvedValue(true);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<OnboardingPage />);

    const username = await screen.findByLabelText(/username/i);
    const password = screen.getByLabelText(/^password$/i);
    const confirm = screen.getByLabelText(/confirm password/i);
    const submit = screen.getByRole("button", { name: /create account/i });

    await userEvent.type(username, "good_name");
    await userEvent.type(password, "longenough");
    await userEvent.type(confirm, "longenough");
    await userEvent.click(submit);

    await waitFor(() => {
      expect(actor.registerUser).toHaveBeenCalledWith(
        "good_name",
        "longenough",
      );
    });
  });

  it("shows a taken-username error when availability is false", async () => {
    mockAuth({ isAuthenticated: true });
    const actor = createMockActor();
    actor.getCallerProfile.mockResolvedValue(null);
    actor.isUsernameAvailable.mockResolvedValue(false);
    useActorMock.mockReturnValue({ actor, isFetching: false });

    await renderWithProviders(<OnboardingPage />);
    const username = await screen.findByLabelText(/username/i);
    await userEvent.type(username, "taken_name");
    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
  });
});
