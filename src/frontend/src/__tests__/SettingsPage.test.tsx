import { SettingsPage } from "@/pages/SettingsPage";
import { Principal } from "@icp-sdk/core/principal";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CALLER, renderWithProviders } from "./test-utils";

const useInternetIdentityMock = vi.hoisted(() => vi.fn());
const useGetCallerProfileMock = vi.hoisted(() => vi.fn());
const useChangePasswordMock = vi.hoisted(() => vi.fn());
const useChangeUsernameMock = vi.hoisted(() => vi.fn());
const useIsUsernameAvailableMock = vi.hoisted(() => vi.fn());
const useSetProfilePictureMock = vi.hoisted(() => vi.fn());
const useSetVisibilityMock = vi.hoisted(() => vi.fn());

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: vi.fn(),
  useInternetIdentity: useInternetIdentityMock,
}));

vi.mock("@/hooks/useQueries", () => ({
  useGetCallerProfile: useGetCallerProfileMock,
  useChangePassword: useChangePasswordMock,
  useChangeUsername: useChangeUsernameMock,
  useIsUsernameAvailable: useIsUsernameAvailableMock,
  useSetProfilePicture: useSetProfilePictureMock,
  useSetVisibility: useSetVisibilityMock,
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ children }: { children: React.ReactNode }) => (
      <a href="/">{children}</a>
    ),
  };
});

function mockMutation(overrides: Record<string, unknown> = {}) {
  const result = (overrides.result ?? true) as boolean;
  const mutate = vi.fn(
    (
      _payload: unknown,
      opts?: { onSuccess?: (r: boolean) => void; onError?: () => void },
    ) => {
      opts?.onSuccess?.(result);
      return Promise.resolve(result);
    },
  );
  return {
    mutate,
    isPending: false,
    isSuccess: false,
    ...overrides,
  };
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInternetIdentityMock.mockReturnValue({
      identity: { getPrincipal: () => CALLER },
    });
    useGetCallerProfileMock.mockReturnValue({
      data: {
        username: "aarav",
        password: "secret",
        createdAt: 1n,
        isPublic: true,
      },
      isLoading: false,
    });
    useIsUsernameAvailableMock.mockReturnValue({ data: true });
    useChangePasswordMock.mockReturnValue(mockMutation());
    useChangeUsernameMock.mockReturnValue(mockMutation());
    useSetProfilePictureMock.mockReturnValue(mockMutation());
    useSetVisibilityMock.mockReturnValue(mockMutation());
  });

  it("loads the settings page with the account summary", async () => {
    await renderWithProviders(<SettingsPage />);
    expect(
      await screen.findByRole("heading", { name: /settings/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("@aarav").length).toBeGreaterThan(0);
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("changes the password when current and new/confirm match", async () => {
    useChangePasswordMock.mockReturnValue(mockMutation());

    await renderWithProviders(<SettingsPage />);
    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "newpass1");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "newpass1",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /update password/i }),
    );

    const mutate = useChangePasswordMock.mock.results[0].value.mutate;
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        { currentPassword: "oldpass", newPassword: "newpass1" },
        expect.anything(),
      );
    });
    expect(await screen.findByText("Password updated.")).toBeInTheDocument();
  });

  it("shows an error and saves nothing when passwords do not match", async () => {
    const mutate = vi.fn();
    useChangePasswordMock.mockReturnValue(mockMutation({ mutate }));

    await renderWithProviders(<SettingsPage />);
    await userEvent.type(screen.getByLabelText("Current password"), "oldpass");
    await userEvent.type(screen.getByLabelText("New password"), "newpass1");
    await userEvent.type(
      screen.getByLabelText("Confirm new password"),
      "different",
    );

    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    // The submit button is disabled while the inputs are invalid.
    expect(
      screen.getByRole("button", { name: /update password/i }),
    ).toBeDisabled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("rejects a taken username with an error", async () => {
    useChangeUsernameMock.mockReturnValue(mockMutation({ result: false }));
    useIsUsernameAvailableMock.mockReturnValue({ data: false });

    await renderWithProviders(<SettingsPage />);
    await userEvent.type(screen.getByLabelText("New username"), "takenname");

    expect(
      await screen.findByText("That username is already taken."),
    ).toBeInTheDocument();
    // The save button is disabled because the username is unavailable.
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    expect(
      useChangeUsernameMock.mock.results[0].value.mutate,
    ).not.toHaveBeenCalled();
  });

  it("saves an available unique username", async () => {
    useChangeUsernameMock.mockReturnValue(mockMutation());
    useIsUsernameAvailableMock.mockReturnValue({ data: true });

    await renderWithProviders(<SettingsPage />);
    const input = screen.getByLabelText("New username");
    await userEvent.type(input, "newhandle");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    const mutate = useChangeUsernameMock.mock.results[0].value.mutate;
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith("newhandle", expect.anything());
    });
    // The onSuccess handler clears the input after a successful save.
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("uploads a profile picture with progress feedback", async () => {
    useSetProfilePictureMock.mockReturnValue(mockMutation());

    await renderWithProviders(<SettingsPage />);
    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const input = screen.getByTestId("settings.picture_input");
    await userEvent.upload(input, file);

    const mutate = useSetProfilePictureMock.mock.results[0].value.mutate;
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ file }),
        expect.anything(),
      );
    });
  });

  it("rejects a non-image profile picture", async () => {
    useSetProfilePictureMock.mockReturnValue(mockMutation());

    await renderWithProviders(<SettingsPage />);
    const file = new File(["data"], "notes.txt", { type: "text/plain" });
    const input = screen.getByTestId("settings.picture_input");
    // userEvent.upload filters by the input's accept="image/*", so a non-image
    // file never reaches onChange; dispatch the change directly to exercise the
    // component's own image-type validation.
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText(/please choose an image file/i),
    ).toBeInTheDocument();
    expect(
      useSetProfilePictureMock.mock.results[0].value.mutate,
    ).not.toHaveBeenCalled();
  });

  it("toggles account visibility to private", async () => {
    useSetVisibilityMock.mockReturnValue(mockMutation());

    await renderWithProviders(<SettingsPage />);
    await userEvent.click(
      screen.getByRole("switch", { name: /toggle private account/i }),
    );

    const mutate = useSetVisibilityMock.mock.results[0].value.mutate;
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith(false);
    });
  });
});
