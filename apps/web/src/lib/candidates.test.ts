import {
  DEFAULT_LIST_CANDIDATES_QUERY,
  createCandidateSchema,
  normalizeBrazilianPhone,
} from "@ciee-curriculos/shared";
import { afterEach, expect, it, vi } from "vitest";

import {
  createCandidate,
  deleteCandidate,
  listCandidates,
} from "@/lib/candidates";

vi.mock(import("@/env"), () => ({
  env: { VITE_SERVER_URL: "http://localhost:3000/" },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

it("requests the backend API and returns its empty page", async () => {
  const page = { items: [], page: 1, pageCount: 0, pageSize: 10, total: 0 };
  const fetchRequest = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(page));
  vi.stubGlobal("fetch", fetchRequest);
  const controller = new AbortController();

  await expect(
    listCandidates(DEFAULT_LIST_CANDIDATES_QUERY, controller.signal)
  ).resolves.toStrictEqual(page);
  const [url, init] = fetchRequest.mock.calls[0] ?? [];
  expect(String(url)).toMatch(/^http:\/\/localhost:3000\/api\/candidates\?/u);
  expect(init?.signal).toBe(controller.signal);
});

it("propagates connection failures without returning demonstration data", async () => {
  const error = new TypeError("Failed to fetch");
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(error));

  await expect(listCandidates(DEFAULT_LIST_CANDIDATES_QUERY)).rejects.toBe(
    error
  );
});

it("deletes candidates through the backend API", async () => {
  const fetchRequest = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchRequest);

  await expect(deleteCandidate(7)).resolves.toBeUndefined();
  expect(fetchRequest).toHaveBeenCalledWith(
    "http://localhost:3000/api/candidates/7",
    expect.objectContaining({ method: "DELETE" })
  );
});

it("sends normalized national digits and shared field transforms as JSON", async () => {
  const fetchRequest = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ id: 7 }));
  vi.stubGlobal("fetch", fetchRequest);
  await createCandidate({
    email: " ANA@EXAMPLE.COM ",
    fullName: " Ana Souza ",
    interestArea: "",
    phone: "+55 (41) 99742-9889",
    professionalSummary: "",
  });
  expect(
    JSON.parse(String(fetchRequest.mock.calls[0]?.[1]?.body))
  ).toStrictEqual({
    email: "ana@example.com",
    fullName: "Ana Souza",
    interestArea: null,
    phone: "41997429889",
    professionalSummary: null,
  });
});

it("sends normalized multipart fields without serializing null as text", async () => {
  const fetchRequest = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json({ id: 7 }));
  vi.stubGlobal("fetch", fetchRequest);
  const file = new File(["%PDF-"], "curriculum.pdf", {
    type: "application/pdf",
  });
  await createCandidate(
    {
      email: "ana@example.com",
      fullName: "Ana Souza",
      interestArea: "",
      phone: "+55 (55) 99742-9889",
      professionalSummary: "",
    },
    file
  );
  const body = fetchRequest.mock.calls[0]?.[1]?.body;
  expect(body).toBeInstanceOf(FormData);
  if (!(body instanceof FormData)) {
    throw new Error("Expected multipart form data");
  }
  expect(body.get("phone")).toBe("55997429889");
  expect(body.has("interestArea")).toBe(false);
  expect(body.has("professionalSummary")).toBe(false);
  expect(body.get("file")).toBeInstanceOf(File);
});

it("rejects invalid phones before making a request", () => {
  const fetchRequest = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchRequest);
  expect(() =>
    createCandidate({
      email: "ana@example.com",
      fullName: "Ana Souza",
      interestArea: null,
      phone: "+1 212 555 1234",
      professionalSummary: null,
    })
  ).toThrow();
  expect(fetchRequest).not.toHaveBeenCalled();
});

it.each([
  "+55 55 41 99999-1234",
  "+55 (20) 99999-1234",
  "+1 212 555 1234",
  "55 41 99999-1234",
  "+55 (41) 99742-9889",
  "(55) 99742-9889",
])(
  "keeps form and backend validation consistent after normalization: %s",
  (phone) => {
    const input = { email: "ana@example.com", fullName: "Ana Souza", phone };
    const backend = createCandidateSchema.safeParse(input);
    const frontend = createCandidateSchema.safeParse({
      ...input,
      phone: normalizeBrazilianPhone(phone),
    });
    expect(frontend.success).toBe(backend.success);
    if (frontend.success && backend.success) {
      expect(frontend.data).toStrictEqual(backend.data);
    }
  }
);
