import { expect, it } from "vitest";

import { formatBrazilianPhone } from "@/lib/phone";

it.each([
  ["41900000909", "(41) 90000-0909"],
  ["4130000909", "(41) 3000-0909"],
  ["+55 (41) 99742-9889", "(41) 99742-9889"],
  ["5541997429889", "(41) 99742-9889"],
  ["55997429889", "(55) 99742-9889"],
  ["+55 (55) 99742-9889", "(55) 99742-9889"],
  ["(41) 3000-0909", "(41) 3000-0909"],
  ["+1 202 555 0100", "+1 202 555 0100"],
  ["12345", "12345"],
  [null, "Não informado"],
  [undefined, "Não informado"],
  ["  ", "Não informado"],
])("formats %s for display as %s", (value, expected) => {
  expect(formatBrazilianPhone(value)).toBe(expected);
});
