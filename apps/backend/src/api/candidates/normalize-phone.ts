export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replaceAll(/\D/gu, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}
