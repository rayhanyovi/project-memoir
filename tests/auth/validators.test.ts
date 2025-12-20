import { describe, expect, it } from "vitest";

import { normalizeEmail } from "../../lib/auth/utils";
import { credentialsSchema, registerSchema } from "../../lib/validators/auth";

describe("register schema", () => {
  it("rejects invalid email", () => {
    expect(() =>
      registerSchema.parse({
        email: "not-an-email",
        password: "password123",
      })
    ).toThrow();
  });

  it("rejects short password", () => {
    expect(() =>
      registerSchema.parse({
        email: "user@example.com",
        password: "short",
      })
    ).toThrow();
  });
});

describe("credentials schema", () => {
  it("normalizes email to lowercase", () => {
    const parsed = credentialsSchema.parse({
      email: "User@Example.COM ",
      password: "password123",
    });

    expect(parsed.email).toBe("user@example.com");
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  TeSt@Email.com ")).toBe("test@email.com");
  });
});
