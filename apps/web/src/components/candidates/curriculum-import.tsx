import { Checkbox } from "@ciee-curriculos/ui/components/checkbox";
import { LoaderCircle, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";

import { PdfFileIcon } from "@/components/pdf-file-icon";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/candidates";
import type { PdfImportResult } from "@/lib/candidates";

interface CurriculumImportProps {
  file: File | undefined;
  importing: boolean;
  importResult: PdfImportResult | null;
  saving: boolean;
  storeCurriculum: boolean;
  selectPdf: (file: File | undefined) => Promise<void>;
  removeFile: () => void;
  setStoreCurriculum: (store: boolean) => void;
}

export function CurriculumImport({
  file,
  importing,
  importResult,
  saving,
  storeCurriculum,
  selectPdf,
  removeFile,
  setStoreCurriculum,
}: CurriculumImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const dragDepthRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const uploadDisabled = saving || importing;

  const resetDrag = () => {
    dragDepthRef.current = 0;
    setDragging(false);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (uploadDisabled || !event.dataTransfer.types.includes("Files")) {
      return;
    }
    dragDepthRef.current += 1;
    setDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setDragging(false);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    resetDrag();
    if (uploadDisabled) {
      return;
    }
    await selectPdf(event.dataTransfer.files[0]);
  };

  useEffect(() => {
    if (importResult) {
      reviewRef.current?.focus();
    }
  }, [importResult]);

  const handleRemoveFile = () => {
    removeFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    requestAnimationFrame(() => importButtonRef.current?.focus());
  };

  return (
    <>
      <div className="curriculum-import">
        <input
          aria-label="Selecionar currículo PDF"
          accept="application/pdf,.pdf"
          hidden
          disabled={saving || importing}
          onChange={async (event) => {
            const selectedFile = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            await selectPdf(selectedFile);
          }}
          ref={fileInputRef}
          type="file"
        />
        <div
          className="curriculum-dropzone"
          role="presentation"
          data-dragging={dragging && !uploadDisabled}
          data-has-file={Boolean(file)}
          aria-busy={importing}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = uploadDisabled ? "none" : "copy";
          }}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="selected-file">
              {importing ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <PdfFileIcon />
              )}
              <div className="selected-file-info">
                <span className="selected-file-name">{file.name}</span>
                <span className="selected-file-size">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <Button
                aria-label={
                  importing
                    ? "Cancelar importação do currículo"
                    : "Remover currículo"
                }
                disabled={saving}
                onClick={handleRemoveFile}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Button
              aria-describedby="curriculum-help"
              className="h-auto min-h-32 w-full flex-col px-6 py-6 whitespace-normal"
              disabled={uploadDisabled}
              onClick={() => fileInputRef.current?.click()}
              ref={importButtonRef}
              type="button"
              variant="ghost"
            >
              <Upload aria-hidden="true" data-icon="inline-start" />
              <span>Arraste e solte seu currículo aqui</span>
              <span>ou clique para selecionar um PDF de até 5 MB</span>
            </Button>
          )}
        </div>
        {file && (
          <div className="curriculum-storage-option">
            <label
              className="curriculum-storage-label"
              htmlFor="store-curriculum"
            >
              <Checkbox
                checked={storeCurriculum}
                className="rounded-sm"
                disabled={saving}
                id="store-curriculum"
                name="storeCurriculum"
                onCheckedChange={setStoreCurriculum}
                aria-describedby="curriculum-storage-help"
              />
              Armazenar PDF no cadastro
            </label>
            <p className="form-intro" id="curriculum-storage-help">
              Opcional. Sem marcar, apenas os dados importados serão utilizados.
            </p>
          </div>
        )}
        <p className="form-intro" id="curriculum-help">
          Preencha os dados manualmente ou importe um PDF de até 5 MB para
          sugerir nome, e-mail e telefone.
        </p>
        <output className="import-status" aria-live="polite">
          {importing ? "Lendo o currículo… Você pode cancelar pela cruz." : ""}
        </output>
      </div>
      {importResult && (
        <section className="feedback-panel" aria-labelledby="review-heading">
          <h2 id="review-heading" ref={reviewRef} tabIndex={-1}>
            Revise os dados do currículo
          </h2>
          <p>
            Confira os dados sugeridos e preencha as informações que faltam
            antes de salvar.
          </p>
          {importResult.warnings.length > 0 && (
            <ul>
              {importResult.warnings.map((warning) => (
                <li key={warning.code}>{warning.message}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
