import { describe, expect, it } from "vitest";

import {
  WORKSPACE_SLUG_REGEX,
  createWorkspaceSchema,
  inviteMemberSchema,
  workspaceRoleSchema,
} from "../../lib/validators/workspace";

describe("workspace slug", () => {
  it("accepts valid slugs", () => {
    const parsed = createWorkspaceSchema.parse({ name: "Memoir", slug: "memoir-team-1" });
    expect(parsed.slug).toMatch(WORKSPACE_SLUG_REGEX);
  });

  it("rejects invalid slugs", () => {
    expect(() =>
      createWorkspaceSchema.parse({ name: "Memoir", slug: "Bad_Slug!" })
    ).toThrow();
  });
});

describe("workspace invites", () => {
  it("rejects invalid roles", () => {
    expect(() => workspaceRoleSchema.parse("SUPERADMIN")).toThrow();
  });

  it("validates invite payloads", () => {
    const invite = inviteMemberSchema.parse({
      email: "member@example.com",
      role: "MEMBER",
    });

    expect(invite.role).toBe("MEMBER");
  });
});
