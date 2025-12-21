import { describe, expect, it } from "vitest";

import { isValidSlug, makeUniqueSlug, slugify } from "../../src/lib/slug";

describe("slug helpers", () => {
  it("slugify normalizes names", () => {
    expect(slugify("  My Workspace  ")).toBe("my-workspace");
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("Too___Many   Spaces")).toBe("too-many-spaces");
  });

  it("validates workspace slugs", () => {
    expect(isValidSlug("my-workspace")).toBe(true);
    expect(isValidSlug("my--workspace")).toBe(false);
    expect(isValidSlug("My-Workspace")).toBe(false);
  });

  it("generates unique slugs with suffixes", async () => {
    const existing = new Set(["my-workspace", "my-workspace-2"]);
    const result = await makeUniqueSlug("My Workspace", async (candidate) =>
      existing.has(candidate)
    );
    expect(result).toBe("my-workspace-3");
  });
});
