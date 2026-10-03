import { describe, expect, it } from "vitest";

import { createCorsOptions } from "./cors.js";

describe("CORS configuration", () => {
  it("supports the explicit wildcard configuration", () => {
    expect(createCorsOptions(" * ")).toStrictEqual({ origin: "*" });
  });

  it.each([
    "https://allowed.example/path",
    "https://allowed.example?query=1",
    "https://allowed.example#fragment",
    "https://user:password@allowed.example",
    "file:///local",
    "invalid",
    "",
  ])("rejects an invalid CORS origin: %s", (origin) => {
    expect(() => createCorsOptions(origin)).toThrow(/CORS_ORIGIN|Invalid URL/u);
  });
});
