// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useNewCandidateForm } from "@/hooks/use-new-candidate-form";

const mocks = vi.hoisted(() => ({
  isPending: false,
  mutateAsync: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    isPending: mocks.isPending,
    mutateAsync: mocks.mutateAsync,
  }),
  useQueryClient: () => ({}),
}));
vi.mock("@tanstack/react-router", () => ({
  useBlocker: () => ({}),
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/lib/candidate-mutations", () => ({
  createCandidateMutationOptions: vi.fn(),
}));
vi.mock("@/hooks/use-curriculum-import", () => ({
  useCurriculumImport: () => ({ importing: false, storeCurriculum: false }),
}));
vi.mock("@ciee-curriculos/ui/components/toast", () => ({
  toast: { promise: (promise: Promise<unknown>) => promise },
}));

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isPending = false;
});
afterEach(cleanup);

it("blocks missing required fields and reports field errors", async () => {
  const { result } = renderHook(useNewCandidateForm);
  await act(() => result.current.handleSubmit(submitEvent()));
  expect(result.current.fieldErrors).toHaveProperty("fullName");
  expect(result.current.fieldErrors).toHaveProperty("email");
  expect(mocks.mutateAsync).not.toHaveBeenCalled();
});

it("submits normalized values and navigates only after persistence succeeds", async () => {
  mocks.mutateAsync.mockResolvedValue({ id: 7 });
  const { result } = renderHook(useNewCandidateForm);
  act(() => {
    result.current.updateField("fullName", " Ana Souza ");
    result.current.updateField("email", " ANA@EXAMPLE.COM ");
    result.current.updateField("phone", "+55 (41) 99999-1234");
  });
  await act(() => result.current.handleSubmit(submitEvent()));
  expect(mocks.mutateAsync).toHaveBeenCalledWith({
    file: undefined,
    input: {
      email: "ana@example.com",
      fullName: "Ana Souza",
      interestArea: null,
      phone: "41999991234",
      professionalSummary: null,
    },
  });
  expect(mocks.navigate).toHaveBeenCalledWith(
    expect.objectContaining({
      params: { candidateId: "7" },
      to: "/candidates/$candidateId",
    })
  );
});

it("preserves form values and shows persistence errors without navigation", async () => {
  mocks.mutateAsync.mockRejectedValue(new Error("Email already registered"));
  const { result } = renderHook(useNewCandidateForm);
  act(() => {
    result.current.updateField("fullName", "Ana Souza");
    result.current.updateField("email", "ana@example.com");
  });
  await act(() => result.current.handleSubmit(submitEvent()));
  expect(result.current.formError).toBe("Email already registered");
  expect(result.current.form.fullName).toBe("Ana Souza");
  expect(mocks.navigate).not.toHaveBeenCalled();
});

it("prevents another submission while saving", async () => {
  mocks.isPending = true;
  const { result } = renderHook(useNewCandidateForm);
  await act(() => result.current.handleSubmit(submitEvent()));
  expect(mocks.mutateAsync).not.toHaveBeenCalled();
});
