import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../../src/lib/auth/password";

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const password = "Sup3rSecur3!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(verifyPassword(hash, password)).resolves.toBe(true);
  });

  it("fails verification on wrong password", async () => {
    const password = "CorrectHorseBatteryStaple";
    const hash = await hashPassword(password);

    await expect(verifyPassword(hash, "wrong")).resolves.toBe(false);
  });
});
