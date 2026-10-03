import {
  interestAreas,
  normalizeBrazilianPhone,
} from "@ciee-curriculos/shared";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@ciee-curriculos/ui/components/combobox";
import { Input } from "@ciee-curriculos/ui/components/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@ciee-curriculos/ui/components/input-group";
import { Textarea } from "@ciee-curriculos/ui/components/textarea";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import type { CandidateFieldErrors } from "@/hooks/use-new-candidate-form";
import type { CandidateInput } from "@/lib/candidates";

interface CandidateFormFieldsProps {
  disabled: boolean;
  fieldErrors: CandidateFieldErrors;
  form: CandidateInput;
  updateField: (field: keyof CandidateInput, value: string) => void;
}

export function CandidateFormFields({
  disabled,
  fieldErrors,
  form,
  updateField,
}: CandidateFormFieldsProps) {
  return (
    <FieldGroup>
      <Field data-invalid={Boolean(fieldErrors.fullName)}>
        <FieldLabel htmlFor="fullName">
          Nome completo <span className="form-required">*</span>
        </FieldLabel>
        <Input
          disabled={disabled}
          autoComplete="name"
          id="fullName"
          name="fullName"
          aria-invalid={Boolean(fieldErrors.fullName)}
          aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
          maxLength={200}
          onChange={(event) => updateField("fullName", event.target.value)}
          placeholder="Digite o nome completo"
          required
          value={form.fullName}
        />
        {fieldErrors.fullName && (
          <FieldError id="fullName-error">{fieldErrors.fullName}</FieldError>
        )}
      </Field>
      <FieldGroup className="form-grid">
        <Field data-invalid={Boolean(fieldErrors.email)}>
          <FieldLabel htmlFor="email">
            E-mail <span className="form-required">*</span>
          </FieldLabel>
          <Input
            disabled={disabled}
            autoComplete="email"
            spellCheck={false}
            id="email"
            name="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
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
        <Field data-invalid={Boolean(fieldErrors.phone)}>
          <FieldLabel htmlFor="phone">Telefone</FieldLabel>
          <InputGroup data-disabled={disabled}>
            <InputGroupAddon>
              <InputGroupText aria-label="Brasil, código do país +55">
                +55
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              disabled={disabled}
              autoComplete="tel-national"
              type="tel"
              inputMode="tel"
              id="phone"
              name="phone"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={
                fieldErrors.phone ? "phone-help phone-error" : "phone-help"
              }
              onChange={(event) =>
                updateField(
                  "phone",
                  normalizeBrazilianPhone(event.target.value)
                )
              }
              placeholder="41 99999-9999"
              value={form.phone}
            />
          </InputGroup>
          <FieldDescription id="phone-help">
            Apenas Brasil (+55). Informe o DDD e o número: 10 dígitos para fixo
            ou 11 para celular.
          </FieldDescription>
          {fieldErrors.phone && (
            <FieldError id="phone-error">{fieldErrors.phone}</FieldError>
          )}
        </Field>
      </FieldGroup>
      <Field data-invalid={Boolean(fieldErrors.interestArea)}>
        <FieldLabel htmlFor="interestArea">
          Área ou cargo de interesse
        </FieldLabel>
        <Combobox
          disabled={disabled}
          items={interestAreas}
          name="interestArea"
          onValueChange={(value) => updateField("interestArea", value ?? "")}
          value={form.interestArea || null}
        >
          <ComboboxInput
            className="w-full"
            disabled={disabled}
            id="interestArea"
            aria-invalid={Boolean(fieldErrors.interestArea)}
            aria-describedby={
              fieldErrors.interestArea ? "interestArea-error" : undefined
            }
            placeholder="Busque uma área ou cargo…"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>Nenhuma área ou cargo encontrado.</ComboboxEmpty>
            <ComboboxList>
              {(area: string) => (
                <ComboboxItem key={area} value={area}>
                  {area}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {fieldErrors.interestArea && (
          <FieldError id="interestArea-error">
            {fieldErrors.interestArea}
          </FieldError>
        )}
      </Field>
      <Field data-invalid={Boolean(fieldErrors.professionalSummary)}>
        <FieldLabel htmlFor="professionalSummary">
          Resumo profissional
        </FieldLabel>
        <Textarea
          disabled={disabled}
          id="professionalSummary"
          name="professionalSummary"
          aria-invalid={Boolean(fieldErrors.professionalSummary)}
          aria-describedby={
            fieldErrors.professionalSummary
              ? "summary-counter professionalSummary-error"
              : "summary-counter"
          }
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
        {fieldErrors.professionalSummary && (
          <FieldError id="professionalSummary-error">
            {fieldErrors.professionalSummary}
          </FieldError>
        )}
      </Field>
    </FieldGroup>
  );
}
