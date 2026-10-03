import { DEFAULT_LIST_CANDIDATES_QUERY } from "@ciee-curriculos/shared";
import { Checkbox } from "@ciee-curriculos/ui/components/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@ciee-curriculos/ui/components/combobox";
import { Input } from "@ciee-curriculos/ui/components/input";
import { Textarea } from "@ciee-curriculos/ui/components/textarea";
import { toast } from "@ciee-curriculos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useBlocker,
  useNavigate,
} from "@tanstack/react-router";
import { FileText, LoaderCircle, Upload, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { createCandidateMutationOptions } from "@/lib/candidate-mutations";
import { formatFileSize, importPdf, interestAreas } from "@/lib/candidates";
import type { CandidateInput, PdfImportResult } from "@/lib/candidates";

export const Route = createFileRoute("/candidates/new")({
  component: NewCandidatePage,
  head: () => ({ meta: [{ title: "Novo candidato | CIEE/PR" }] }),
});

const EMPTY_FORM: CandidateInput = {
  fullName: "",
  email: "",
  phone: "",
  interestArea: "",
  professionalSummary: "",
};
const MAX_PDF_BYTES = 5_000_000;

function NewCandidatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const importControllerRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const savedRef = useRef(false);
  const queryClient = useQueryClient();
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CandidateInput, string>>
  >({});
  const [form, setForm] = useState<CandidateInput>(EMPTY_FORM);
  const [file, setFile] = useState<File | undefined>();
  const [storeCurriculum, setStoreCurriculum] = useState(false);
  const createMutation = useMutation(
    createCandidateMutationOptions(queryClient)
  );
  const saving = createMutation.isPending;
  const [importing, setImporting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<PdfImportResult | null>(
    null
  );

  const isDirty =
    Boolean(file) || Object.values(form).some((value) => value !== "");
  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && !savedRef.current,
    enableBeforeUnload: () => isDirty && !savedRef.current,
    withResolver: true,
  });
  useEffect(() => {
    if (formError) {
      errorRef.current?.focus();
    }
  }, [formError]);
  useEffect(() => {
    if (importResult) {
      reviewRef.current?.focus();
    }
  }, [importResult]);
  useEffect(() => () => importControllerRef.current?.abort(), []);
  const removeFile = () => {
    importControllerRef.current?.abort();
    importControllerRef.current = null;
    setImporting(false);
    setFormError(null);
    setFile(undefined);
    setStoreCurriculum(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    requestAnimationFrame(() => importButtonRef.current?.focus());
  };

  const updateField = (field: keyof CandidateInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectPdf = async (selectedFile: File | undefined) => {
    if (!selectedFile) {
      return;
    }
    if (!selectedFile.name.toLocaleLowerCase("pt-BR").endsWith(".pdf")) {
      setFormError("Selecione um arquivo PDF.");
      return;
    }
    if (selectedFile.size === 0) {
      setFormError("O arquivo está vazio. Selecione outro PDF.");
      return;
    }
    if (selectedFile.size > MAX_PDF_BYTES) {
      setFormError("O arquivo deve ter no máximo 5 MB.");
      return;
    }

    const controller = new AbortController();
    importControllerRef.current = controller;
    setFormError(null);
    setFile(selectedFile);
    setImportResult(null);
    setImporting(true);
    try {
      const result = await importPdf(selectedFile, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setImportResult(result);
      setForm((current) => ({
        ...current,
        email: result.data.email ?? current.email,
        fullName: result.data.fullName ?? current.fullName,
        phone: result.data.phone ?? current.phone,
      }));
      setFieldErrors({});
      if (result.warnings.length > 0) {
        toast.add({
          type: "warning",
          title: "Revise os dados sugeridos antes de salvar.",
        });
      } else {
        toast.add({
          type: "success",
          title: "Dados do currículo preenchidos para revisão.",
        });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setFormError(
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || importing) {
      return;
    }
    setFormError(null);
    const errors: Partial<Record<keyof CandidateInput, string>> = {};
    if (!form.fullName.trim()) {
      errors.fullName = "Informe o nome completo.";
    }
    const emailInput = event.currentTarget.elements.namedItem("email");
    if (!form.email.trim()) {
      errors.email = "Informe o e-mail.";
    } else if (
      emailInput instanceof HTMLInputElement &&
      !emailInput.validity.valid
    ) {
      errors.email = "Informe um e-mail válido, como nome@exemplo.com.";
    }
    setFieldErrors(errors);
    const [firstInvalidField] = Object.keys(errors);
    if (firstInvalidField) {
      requestAnimationFrame(() => {
        const input = formRef.current?.elements.namedItem(firstInvalidField);
        if (input instanceof HTMLElement) {
          input.focus();
        }
      });
      return;
    }
    try {
      const candidate = await createMutation.mutateAsync({
        input: {
          ...form,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
        },
        file: storeCurriculum ? file : undefined,
      });
      toast.add({
        type: "success",
        title: "Candidato cadastrado com sucesso.",
      });
      savedRef.current = true;
      await navigate({
        params: { candidateId: String(candidate.id) },
        search: DEFAULT_LIST_CANDIDATES_QUERY,
        to: "/candidates/$candidateId",
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o candidato."
      );
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Novo candidato</h1>
          <p>
            Cadastre um novo candidato manualmente ou importe os dados de um
            currículo em PDF.
          </p>
        </div>
      </div>
      <section className="content-card form-card">
        <form
          className="candidate-form"
          onSubmit={handleSubmit}
          ref={formRef}
          noValidate
          aria-busy={saving || importing}
        >
          <p className="form-intro">
            Os campos marcados com * são obrigatórios.
          </p>
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
                  <FileText aria-hidden="true" />
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
                  onClick={removeFile}
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
                  Opcional. Sem marcar, apenas os dados importados serão
                  utilizados.
                </p>
              </div>
            )}
            <p className="form-intro" id="curriculum-help">
              Preencha os dados manualmente ou importe um PDF de até 5 MB para
              sugerir nome, e-mail e telefone.
            </p>
            <output className="import-status" aria-live="polite">
              {importing
                ? "Lendo o currículo… Você pode cancelar pela cruz."
                : ""}
            </output>
          </div>
          {importResult && (
            <section
              className="feedback-panel"
              aria-labelledby="review-heading"
            >
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
          <FieldGroup>
            <Field data-invalid={Boolean(fieldErrors.fullName)}>
              <FieldLabel htmlFor="fullName">
                Nome completo <span className="form-required">*</span>
              </FieldLabel>
              <Input
                disabled={saving || importing}
                autoComplete="name"
                id="fullName"
                name="fullName"
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={
                  fieldErrors.fullName ? "fullName-error" : undefined
                }
                maxLength={200}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                placeholder="Digite o nome completo"
                required
                value={form.fullName}
              />
              {fieldErrors.fullName && (
                <FieldError id="fullName-error">
                  {fieldErrors.fullName}
                </FieldError>
              )}
            </Field>
            <FieldGroup className="form-grid">
              <Field data-invalid={Boolean(fieldErrors.email)}>
                <FieldLabel htmlFor="email">
                  E-mail <span className="form-required">*</span>
                </FieldLabel>
                <Input
                  disabled={saving || importing}
                  autoComplete="email"
                  spellCheck={false}
                  id="email"
                  name="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  maxLength={254}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="exemplo@email.com"
                  required
                  type="email"
                  value={form.email}
                />
                {fieldErrors.email && (
                  <FieldError id="email-error">{fieldErrors.email}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Telefone</FieldLabel>
                <Input
                  disabled={saving || importing}
                  autoComplete="tel"
                  type="tel"
                  inputMode="tel"
                  id="phone"
                  name="phone"
                  maxLength={32}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(41) 90000-0000"
                  value={form.phone}
                />
              </Field>
            </FieldGroup>
            <Field>
              <FieldLabel htmlFor="interestArea">
                Área ou cargo de interesse
              </FieldLabel>
              <Combobox
                disabled={saving || importing}
                items={interestAreas}
                name="interestArea"
                onValueChange={(value) =>
                  updateField("interestArea", value ?? "")
                }
                value={form.interestArea || null}
              >
                <ComboboxInput
                  className="w-full"
                  disabled={saving || importing}
                  id="interestArea"
                  placeholder="Busque uma área ou cargo…"
                  showClear
                />
                <ComboboxContent>
                  <ComboboxEmpty>
                    Nenhuma área ou cargo encontrado.
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(area: string) => (
                      <ComboboxItem key={area} value={area}>
                        {area}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>
            <Field>
              <FieldLabel htmlFor="professionalSummary">
                Resumo profissional
              </FieldLabel>
              <Textarea
                disabled={saving || importing}
                id="professionalSummary"
                name="professionalSummary"
                aria-describedby="summary-counter"
                rows={5}
                maxLength={2000}
                onChange={(event) =>
                  updateField("professionalSummary", event.target.value)
                }
                placeholder="Conte um pouco sobre a experiência, habilidades e objetivos…"
                value={form.professionalSummary}
              />
              <FieldDescription id="summary-counter" className="text-right">
                {form.professionalSummary.length}/2000 caracteres
              </FieldDescription>
            </Field>
          </FieldGroup>
          {formError && (
            <p
              className="warning-list"
              role="alert"
              ref={errorRef}
              tabIndex={-1}
            >
              {formError}
            </p>
          )}
          <div className="form-footer">
            <Link
              className={buttonVariants({ variant: "outline" })}
              search={DEFAULT_LIST_CANDIDATES_QUERY}
              to="/candidates"
            >
              Cancelar
            </Link>
            <Button disabled={saving || importing} type="submit">
              {saving ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <UserRound data-icon="inline-start" />
              )}
              {saving ? "Salvando…" : "Salvar candidato"}
            </Button>
          </div>
        </form>
      </section>
      <AlertDialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open) {
            blocker.reset?.();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados deste cadastro ainda não foram salvos. Se sair, suas
              alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar cadastro</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => blocker.proceed?.()}
            >
              Descartar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
