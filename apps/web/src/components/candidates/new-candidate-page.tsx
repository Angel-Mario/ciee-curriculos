import { DEFAULT_LIST_CANDIDATES_QUERY } from "@ciee-curriculos/shared";
import { Link } from "@tanstack/react-router";
import { LoaderCircle, UserRound } from "lucide-react";

import { CandidateFormFields } from "@/components/candidates/candidate-form-fields";
import { CurriculumImport } from "@/components/candidates/curriculum-import";
import { DiscardCandidateDialog } from "@/components/candidates/discard-candidate-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useNewCandidateForm } from "@/hooks/use-new-candidate-form";

export function NewCandidatePage() {
  const {
    blocker,
    curriculum,
    errorRef,
    fieldErrors,
    form,
    formError,
    formRef,
    handleSubmit,
    saving,
    updateField,
  } = useNewCandidateForm();
  const { importing } = curriculum;

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
          <CurriculumImport {...curriculum} saving={saving} />
          <CandidateFormFields
            disabled={saving || importing}
            fieldErrors={fieldErrors}
            form={form}
            updateField={updateField}
          />
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
      <DiscardCandidateDialog
        open={blocker.status === "blocked"}
        onCancel={() => blocker.reset?.()}
        onDiscard={() => blocker.proceed?.()}
      />
    </>
  );
}
