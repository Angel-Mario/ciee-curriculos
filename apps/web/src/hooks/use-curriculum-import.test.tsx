// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useCurriculumImport } from "@/hooks/use-curriculum-import";
import { importPdf } from "@/lib/candidates";
import type { PdfImportResult } from "@/lib/candidates";

vi.mock(import("@/lib/candidates"), () => ({ importPdf: vi.fn() }));
vi.mock("@ciee-curriculos/ui/components/toast", () => ({
  toast: { add: vi.fn() },
}));

const suggestion: PdfImportResult = {
  data: {
    email: "ana@example.com",
    fullName: "Ana Souza",
    phone: "41999991234",
  },
  missingFields: [],
  warnings: [],
};

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

it.each([
  new File(["text"], "resume.txt"),
  new File([], "resume.pdf"),
  new File([new Uint8Array(5_000_001)], "resume.pdf"),
])("rejects invalid files before calling the backend: %o", async (file) => {
  const onError = vi.fn();
  const { result } = renderHook(() =>
    useCurriculumImport({ onError, onImported: vi.fn() })
  );
  await act(() => result.current.selectPdf(file));
  expect(onError).toHaveBeenCalledWith(expect.any(String));
  expect(importPdf).not.toHaveBeenCalled();
  expect(result.current.file).toBeUndefined();
});

it("offers suggestions for review without enabling PDF storage automatically", async () => {
  vi.mocked(importPdf).mockResolvedValue(suggestion);
  const onImported = vi.fn();
  const { result } = renderHook(() =>
    useCurriculumImport({ onError: vi.fn(), onImported })
  );
  await act(() => result.current.selectPdf(new File(["pdf"], "resume.pdf")));
  expect(onImported).toHaveBeenCalledWith(suggestion);
  expect(result.current.importResult).toEqual(suggestion);
  expect(result.current.storeCurriculum).toBe(false);
  expect(result.current.importing).toBe(false);
});

it("recovers from a read failure so manual registration can continue", async () => {
  vi.mocked(importPdf).mockRejectedValue(new Error("PDF unreadable"));
  const onError = vi.fn();
  const onImported = vi.fn();
  const { result } = renderHook(() =>
    useCurriculumImport({ onError, onImported })
  );
  await act(() => result.current.selectPdf(new File(["pdf"], "resume.pdf")));
  expect(onError).toHaveBeenCalledWith("PDF unreadable");
  expect(onImported).not.toHaveBeenCalled();
  expect(result.current.importing).toBe(false);
  act(() => result.current.removeFile());
  expect(result.current.file).toBeUndefined();
  expect(onError).toHaveBeenLastCalledWith(null);
});

it("cancels an old import and ignores its late response", async () => {
  const firstResponse = Promise.withResolvers<PdfImportResult>();
  vi.mocked(importPdf)
    .mockReturnValueOnce(firstResponse.promise)
    .mockResolvedValueOnce(suggestion);
  const onImported = vi.fn();
  const { result } = renderHook(() =>
    useCurriculumImport({ onError: vi.fn(), onImported })
  );
  let firstImport: Promise<void> | undefined;
  act(() => {
    firstImport = result.current.selectPdf(new File(["pdf"], "first.pdf"));
  });
  const firstSignal = vi.mocked(importPdf).mock.calls[0]?.[1];
  await act(() => result.current.selectPdf(new File(["pdf"], "second.pdf")));
  expect(firstSignal?.aborted).toBe(true);
  await act(async () => {
    firstResponse.resolve(suggestion);
    await firstImport;
  });
  expect(onImported).toHaveBeenCalledOnce();
  expect(result.current.file?.name).toBe("second.pdf");
});
