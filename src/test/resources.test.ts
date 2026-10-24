import { describe, expect, it } from "vitest";
import { safeResourceUrl } from "../lib/resources";

describe("resource links", () => {
  it("accepts educational channel and exercise web links", () => {
    expect(safeResourceUrl("https://www.youtube.com/@teacher")).toBe("https://www.youtube.com/@teacher");
    expect(safeResourceUrl("https://example.org/exercises.pdf")).toBe("https://example.org/exercises.pdf");
  });
  it("rejects executable links and embedded credentials", () => {
    expect(safeResourceUrl("javascript:alert(1)")).toBeNull();
    expect(safeResourceUrl("https://user:password@example.org")).toBeNull();
    expect(safeResourceUrl("not a link")).toBeNull();
  });
});