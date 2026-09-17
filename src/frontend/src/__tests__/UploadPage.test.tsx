import { UploadPage } from "@/pages/UploadPage";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./test-utils";

const useAddReelMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useQueries", () => ({
  useAddReel: useAddReelMock,
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function videoFile(name = "clip.mp4") {
  return new File(["fake-video-bytes"], name, { type: "video/mp4" });
}

function mockAddReel(overrides: Record<string, unknown> = {}) {
  useAddReelMock.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    ...overrides,
  });
}

describe("UploadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddReel();
  });

  it("rejects a non-video file without enabling submit", async () => {
    await renderWithProviders(<UploadPage />);

    const input = screen.getByTestId("upload.input");
    const textFile = new File(["hello"], "notes.txt", { type: "text/plain" });
    await userEvent.upload(input, textFile);

    // A non-video file is not accepted: no file is selected and the submit
    // button stays disabled (no validation message is rendered).
    const submit = screen.getByRole("button", { name: /publish reel/i });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByText(/please choose a video file/i),
    ).not.toBeInTheDocument();
  });

  it("uploads a video with a caption via the backend", async () => {
    const mutate = vi.fn();
    mockAddReel({ mutate });
    await renderWithProviders(<UploadPage />);

    const input = screen.getByTestId("upload.input");
    await userEvent.upload(input, videoFile());

    const caption = screen.getByLabelText(/caption/i);
    await userEvent.type(caption, "My first reel");

    const submit = screen.getByRole("button", { name: /publish reel/i });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
      const [args] = mutate.mock.calls[0];
      expect(args.caption).toBe("My first reel");
      expect(args.file.name).toBe("clip.mp4");
      expect(typeof args.onProgress).toBe("function");
    });
  });

  it("keeps submit disabled until a file and caption are provided", async () => {
    await renderWithProviders(<UploadPage />);

    const submit = screen.getByRole("button", { name: /publish reel/i });
    expect(submit).toBeDisabled();

    const caption = screen.getByLabelText(/caption/i);
    await userEvent.type(caption, "caption only");
    expect(submit).toBeDisabled();

    const input = screen.getByTestId("upload.input");
    await userEvent.upload(input, videoFile());
    expect(submit).toBeEnabled();
  });
});
