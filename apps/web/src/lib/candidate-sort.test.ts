import assert from "node:assert/strict";
import { test } from "node:test";

import { candidateColumns, compareCandidates } from "./candidate-sort.ts";
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

test("every visible candidate field sorts in both directions", () => {
  for (const { key } of candidateColumns) {
    assert.ok(compareCandidates(first, second, key, true) < 0, key);
    assert.ok(compareCandidates(first, second, key, false) > 0, key);
  }
});

test("dates sort chronologically across years and time zones", () => {
  const earlier = { ...first, createdAt: "2026-01-01T02:30:00Z" };
  const later = { ...second, createdAt: "2025-12-31T23:45:00-03:00" };
  assert.ok(compareCandidates(earlier, later, "createdAt", true) < 0);
});

test("missing and invalid values stay last in either direction", () => {
  const missing = {
    ...second,
    createdAt: "invalid",
    interestArea: null,
    phone: null,
  };
  for (const key of ["phone", "interestArea", "createdAt"] as const) {
    for (const ascending of [true, false]) {
      assert.ok(compareCandidates(first, missing, key, ascending) < 0);
      assert.ok(compareCandidates(missing, first, key, ascending) > 0);
    }
  }
});

test("equivalent phone formats and accented names have stable ties", () => {
  const equivalent = { ...second, fullName: "Ána", phone: "41900000001" };
  assert.equal(compareCandidates(first, equivalent, "phone", true), -1);
  assert.equal(compareCandidates(first, equivalent, "phone", false), -1);
});
