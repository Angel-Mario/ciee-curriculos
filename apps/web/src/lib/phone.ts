import { normalizeBrazilianPhone } from "@ciee-curriculos/shared";

const NATIONAL_PHONE_PATTERN = /^\d{10,11}$/u;

export function formatBrazilianPhone(value?: string | null): string {
  if (!value?.trim()) {
    return "Não informado";
  }

  const nationalNumber = normalizeBrazilianPhone(value);
  if (!NATIONAL_PHONE_PATTERN.test(nationalNumber)) {
    return value.trim();
  }

  const areaCode = nationalNumber.slice(0, 2);
  const subscriberPrefix = nationalNumber.slice(2, -4);
  const subscriberSuffix = nationalNumber.slice(-4);
  return `(${areaCode}) ${subscriberPrefix}-${subscriberSuffix}`;
}
