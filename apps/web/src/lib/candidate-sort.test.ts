import { describe, expect, it } from "vitest";

import { candidateColumns, compareCandidates } from "./candidate-sort";
import type { Candidate } from "./candidates";

const first: Candidate = {
  createdAt: "2025-12-31T23:00:00-03:00",
  email: "ana@example.com",
  fullName: "Ana",
  id: 1,
  interestArea: "Análise de Dados",
  phone: "(41) 90000-0001",
  professionalSummary: null,
};
const second: Candidate = {
  createdAt: "2026-01-02T00:00:00Z",
  email: "bruno@example.com",
  fullName: "Bruno",
  id: 2,
  interestArea: "Suporte Técnico",
  phone: "41900000002",
  professionalSummary: null,
};

describe("candidate sorting", () => {
  it("sorts every visible candidate field in both directions", () => {
    for (const { key } of candidateColumns) {
      expect(compareCandidates(first, second, key, true)).toBeLessThan(0);
      expect(compareCandidates(first, second, key, false)).toBeGreaterThan(0);
    }
  });

  it("sorts candidate IDs numerically", () => {
    expect(compareCandidates(first, second, "id", true)).toBeLessThan(0);
  });

  it("keeps missing and invalid values last in either direction", () => {
    const missing = {
      ...second,
      interestArea: null,
      phone: null,
    };
    for (const key of ["phone", "interestArea"] as const) {
      for (const ascending of [true, false]) {
        expect(compareCandidates(first, missing, key, ascending)).toBeLessThan(
          0
        );
        expect(
          compareCandidates(missing, first, key, ascending)
        ).toBeGreaterThan(0);
      }
    }
  });

  it("keeps equivalent phone formats and accented names stable", () => {
    const equivalent = { ...second, fullName: "Ána", phone: "41900000001" };
    expect(compareCandidates(first, equivalent, "phone", true)).toBe(-1);
    expect(compareCandidates(first, equivalent, "phone", false)).toBe(-1);
  });
});
