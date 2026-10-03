import { toast } from "@ciee-curriculos/ui/components/toast";
import { useEffect, useRef, useState } from "react";

import { importPdf } from "@/lib/candidates";
import type { PdfImportResult } from "@/lib/candidates";

const MAX_PDF_BYTES = 5_000_000;

interface CurriculumImportOptions {
  onImported: (result: PdfImportResult) => void;
  onError: (message: string | null) => void;
}

export function useCurriculumImport({
  onImported,
  onError,
}: CurriculumImportOptions) {
  const importControllerRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | undefined>();
  const [storeCurriculum, setStoreCurriculum] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<PdfImportResult | null>(
    null
  );

  useEffect(() => () => importControllerRef.current?.abort(), []);

  const removeFile = () => {
    importControllerRef.current?.abort();
    importControllerRef.current = null;
    setImporting(false);
    onError(null);
    setFile(undefined);
    setStoreCurriculum(false);
    setImportResult(null);
  };

  const selectPdf = async (selectedFile: File | undefined) => {
    if (!selectedFile) {
      return;
    }
    if (!selectedFile.name.toLocaleLowerCase("pt-BR").endsWith(".pdf")) {
      onError("Selecione um arquivo PDF.");
      return;
    }
    if (selectedFile.size === 0) {
      onError("O arquivo está vazio. Selecione outro PDF.");
      return;
    }
    if (selectedFile.size > MAX_PDF_BYTES) {
      onError("O arquivo deve ter no máximo 5 MB.");
      return;
    }

    importControllerRef.current?.abort();
    const controller = new AbortController();
    importControllerRef.current = controller;
    onError(null);
    setFile(selectedFile);
    setImportResult(null);
    setImporting(true);
    try {
      const result = await importPdf(selectedFile, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setImportResult(result);
      onImported(result);
      toast.add({
        title:
          result.warnings.length > 0
            ? "Revise os dados sugeridos antes de salvar."
            : "Dados do currículo preenchidos para revisão.",
        type: result.warnings.length > 0 ? "warning" : "success",
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      toast.add({
        title:
          error instanceof Error
            ? error.message
            : "Não foi possível importar este currículo.",
        type: "error",
      });
      onError(
        error instanceof Error
          ? error.message
          : "Não foi possível importar este currículo."
      );
    }
    if (importControllerRef.current === controller) {
      importControllerRef.current = null;
      setImporting(false);
    }
  };

  return {
    file,
    importResult,
    importing,
    removeFile,
    selectPdf,
    setStoreCurriculum,
    storeCurriculum,
  };
}
