import { describe, expect, it } from "vitest";

import { CreateWorkspaceSchema } from "../../src/lib/validators/workspace";

describe("CreateWorkspaceSchema", () => {
  it("accepts valid payload", () => {
    const parsed = CreateWorkspaceSchema.parse({
      name: "Workspace",
      slug: "my-workspace",
    });

    expect(parsed.name).toBe("Workspace");
    expect(parsed.slug).toBe("my-workspace");
  });

  it("rejects invalid slug", () => {
    expect(() =>
      CreateWorkspaceSchema.parse({
        name: "Workspace",
        slug: "Invalid Slug",
      })
    ).toThrow();
  });

  it("rejects short name", () => {
    expect(() =>
      CreateWorkspaceSchema.parse({
        name: "A",
      })
    ).toThrow();
  });
});
