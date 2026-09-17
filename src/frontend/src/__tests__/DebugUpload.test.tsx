import { UploadPage } from "@/pages/UploadPage";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "./test-utils";

vi.mock("@/hooks/useQueries", () => ({
  useAddReel: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

it("keeps submit disabled when a non-video file is selected", async () => {
  await renderWithProviders(<UploadPage />);
  const input = screen.getByTestId("upload.input");
  const textFile = new File(["hello"], "notes.txt", { type: "text/plain" });
  await userEvent.upload(input, textFile);
  const submit = screen.getByRole("button", { name: /publish reel/i });
  expect(submit).toBeDisabled();
});
