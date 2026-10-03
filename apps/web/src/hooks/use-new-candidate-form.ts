import {
  createCandidateSchema,
  DEFAULT_LIST_CANDIDATES_QUERY,
  normalizeBrazilianPhone,
} from "@ciee-curriculos/shared";
import { toast } from "@ciee-curriculos/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBlocker, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { useCurriculumImport } from "@/hooks/use-curriculum-import";
import { createCandidateMutationOptions } from "@/lib/candidate-mutations";
import type { CandidateInput } from "@/lib/candidates";

export type CandidateFieldErrors = Partial<
  Record<keyof CandidateInput, string>
>;

const EMPTY_FORM: CandidateInput = {
  email: "",
  fullName: "",
  interestArea: "",
  phone: "",
  professionalSummary: "",
};

export function useNewCandidateForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const savedRef = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<CandidateFieldErrors>({});
  const [form, setForm] = useState<CandidateInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useMutation(
    createCandidateMutationOptions(queryClient)
  );
  const saving = createMutation.isPending;
  const curriculum = useCurriculumImport({
    onError: setFormError,
    onImported: (result) => {
      setForm((current) => ({
        ...current,
        email: result.data.email ?? current.email,
        fullName: result.data.fullName ?? current.fullName,
        phone:
          result.data.phone === null
            ? current.phone
            : normalizeBrazilianPhone(result.data.phone),
      }));
      setFieldErrors({});
    },
  });
  const { file, importing, storeCurriculum } = curriculum;
  const isDirty =
    Boolean(file) || Object.values(form).some((value) => value !== "");
  const blocker = useBlocker({
    enableBeforeUnload: () => isDirty && !savedRef.current,
    shouldBlockFn: () => isDirty && !savedRef.current,
    withResolver: true,
  });

  useEffect(() => {
    if (formError) {
      errorRef.current?.focus();
    }
  }, [formError]);

  const updateField = (field: keyof CandidateInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || importing) {
      return;
    }
    setFormError(null);
    const parsed = createCandidateSchema.safeParse(form);
    if (!parsed.success) {
      const errors: CandidateFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const [field] = issue.path;
        if (
          (field === "fullName" ||
            field === "email" ||
            field === "phone" ||
            field === "interestArea" ||
            field === "professionalSummary") &&
          errors[field] === undefined
        ) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      const [firstInvalidField] = Object.keys(errors);
      requestAnimationFrame(() => {
        const input = firstInvalidField
          ? formRef.current?.elements.namedItem(firstInvalidField)
          : null;
        if (input instanceof HTMLElement) {
          input.focus();
        }
      });
      return;
    }
    setFieldErrors({});
    try {
      const candidate = await toast.promise(
        createMutation.mutateAsync({
          file: storeCurriculum ? file : undefined,
          input: parsed.data,
        }),
        {
          error: (error) => ({
            title:
              error instanceof Error
                ? error.message
                : "Não foi possível salvar o candidato.",
          }),
          loading: { title: "Salvando o candidato…" },
          success: { title: "Candidato cadastrado com sucesso." },
        }
      );
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

  return {
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
  };
}
