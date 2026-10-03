// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, expect, it, vi } from "vitest";

import { CandidateFormFields } from "@/components/candidates/candidate-form-fields";
import type { CandidateInput } from "@/lib/candidates";

const form: CandidateInput = {
  email: "",
  fullName: "",
  interestArea: "",
  phone: "",
  professionalSummary: "",
};

afterEach(cleanup);

it("renders required fields, the Brazilian +55 group and length guidance", () => {
  render(
    <CandidateFormFields
      disabled={false}
      fieldErrors={{}}
      form={form}
      updateField={vi.fn()}
    />
  );
  expect(screen.getByLabelText(/Nome completo/u)).toBeRequired();
  expect(screen.getByLabelText(/E-mail/u)).toHaveAttribute("type", "email");
  expect(screen.getByLabelText("Brasil, código do país +55")).toHaveTextContent(
    "+55"
  );
  expect(screen.getByLabelText("Telefone")).toHaveAttribute(
    "autocomplete",
    "tel-national"
  );
  expect(
    screen.getByText(/10 dígitos para fixo ou 11 para celular/u)
  ).toBeInTheDocument();
  expect(screen.getByText("0/2000 caracteres")).toBeInTheDocument();
});

it("normalizes pasted country prefixes before updating the phone field", () => {
  const updateField = vi.fn();
  render(
    <CandidateFormFields
      disabled={false}
      fieldErrors={{}}
      form={form}
      updateField={updateField}
    />
  );
  fireEvent.change(screen.getByLabelText("Telefone"), {
    target: { value: "+55 (41) 99999-1234" },
  });
  expect(updateField).toHaveBeenCalledWith("phone", "41999991234");
});

it("associates validation errors accessibly and disables every field", () => {
  const { container } = render(
    <CandidateFormFields
      disabled
      fieldErrors={{
        email: "E-mail inválido.",
        phone: "Informe um DDD válido.",
      }}
      form={form}
      updateField={vi.fn()}
    />
  );
  const email = screen.getByLabelText(/E-mail/u);
  const phone = screen.getByLabelText("Telefone");
  expect(email).toHaveAttribute("aria-invalid", "true");
  expect(email).toHaveAccessibleDescription("E-mail inválido.");
  expect(phone).toHaveAccessibleDescription(
    expect.stringContaining("Informe um DDD válido.")
  );
  expect(
    container.querySelectorAll(
      "#fullName:disabled, #email:disabled, #phone:disabled, #professionalSummary:disabled"
    )
  ).toHaveLength(4);
});

it("updates the professional summary and its character counter", () => {
  const updateField = vi.fn();
  render(
    <CandidateFormFields
      disabled={false}
      fieldErrors={{}}
      form={form}
      updateField={updateField}
    />
  );
  fireEvent.change(screen.getByLabelText("Resumo profissional"), {
    target: { value: "Experiência em desenvolvimento." },
  });
  expect(updateField).toHaveBeenCalledWith(
    "professionalSummary",
    "Experiência em desenvolvimento."
  );
});
