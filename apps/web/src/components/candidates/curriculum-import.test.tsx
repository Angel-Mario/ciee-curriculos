// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";

import { CurriculumImport } from "@/components/candidates/curriculum-import";
import type { PdfImportResult } from "@/lib/candidates";

const imported: PdfImportResult = {
  data: { email: null, fullName: "Ana Souza", phone: null },
  missingFields: ["email", "phone"],
  warnings: [
    { code: "PARTIAL_EXTRACTION", message: "Complete os dados faltantes." },
  ],
};

afterEach(cleanup);

function renderImport(
  overrides: Partial<Parameters<typeof CurriculumImport>[0]> = {}
) {
  const props = {
    file: undefined,
    importResult: null,
    importing: false,
    removeFile: vi.fn(),
    saving: false,
    selectPdf: vi.fn(),
    setStoreCurriculum: vi.fn(),
    storeCurriculum: false,
    ...overrides,
  };
  return { ...render(<CurriculumImport {...props} />), props };
}

it("announces reading progress and disables file selection during import", () => {
  renderImport({ file: new File(["pdf"], "resume.pdf"), importing: true });
  expect(screen.getByRole("status")).toHaveTextContent("Lendo o currículo");
  expect(
    screen.getByRole("button", { name: "Cancelar importação do currículo" })
  ).toBeEnabled();
  expect(screen.getByLabelText("Selecionar currículo PDF")).toBeDisabled();
});

it("lets the user opt into storing a PDF independently of importing it", () => {
  const { props } = renderImport({ file: new File(["pdf"], "resume.pdf") });
  expect(
    screen.getByRole("checkbox", { name: "Armazenar PDF no cadastro" })
  ).not.toBeChecked();
  expect(
    screen.getByText(/apenas os dados importados serão utilizados/u)
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Armazenar PDF no cadastro" })
  );
  expect(props.setStoreCurriculum).toHaveBeenCalledOnce();
});

it("shows extracted fields for review, including warnings", () => {
  renderImport({
    file: new File(["pdf"], "resume.pdf"),
    importResult: imported,
  });
  expect(
    screen.getByRole("heading", { name: "Revise os dados do currículo" })
  ).toBeInTheDocument();
  expect(screen.getByText("Complete os dados faltantes.")).toBeInTheDocument();
});

it("clears the selected file and returns focus to the import action", () => {
  let scheduledFrame: FrameRequestCallback | undefined;
  // oxlint-disable-next-line promise/prefer-await-to-callbacks
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    scheduledFrame = callback;
    return 1;
  });
  const { props, rerender } = renderImport({
    file: new File(["pdf"], "resume.pdf"),
  });
  fireEvent.click(screen.getByRole("button", { name: "Remover currículo" }));
  expect(props.removeFile).toHaveBeenCalledOnce();
  rerender(<CurriculumImport {...props} file={undefined} />);
  scheduledFrame?.(0);
  expect(
    screen.getByRole("button", { name: /Arraste e solte seu currículo/u })
  ).toHaveFocus();
});
