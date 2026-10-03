import { Checkbox } from "@ciee-curriculos/ui/components/checkbox";
import { LoaderCircle, Upload, X } from "lucide-react";
import { useEffect, useRef } from "react";

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
            disabled={saving}
            onClick={() => fileInputRef.current?.click()}
            ref={importButtonRef}
            type="button"
            variant="outline"
          >
            <Upload aria-hidden="true" data-icon="inline-start" />
            Importar currículo (PDF)
          </Button>
        )}
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
