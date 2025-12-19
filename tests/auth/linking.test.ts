import { describe, expect, it, vi } from "vitest";

import { resolveGoogleLinking } from "../../src/lib/auth/linking";

const mockDb = ({
  user,
  account,
}: {
  user: { id: string; email: string } | null;
  account: { userId: string } | null;
}) => ({
  user: {
    findUnique: vi.fn().mockResolvedValue(user),
  },
  account: {
    findFirst: vi.fn().mockResolvedValue(account),
  },
});

describe("resolveGoogleLinking", () => {
  it("links to an existing user when email matches", async () => {
    const db = mockDb({
      user: { id: "user-1", email: "owner@example.com" },
      account: null,
    });

    const result = await resolveGoogleLinking({
      email: "owner@example.com",
      providerAccountId: "google-123",
      db: db as any,
    });

    expect(result).toEqual({ action: "use-existing", userId: "user-1" });
  });

  it("allows creation when no matching user exists", async () => {
    const db = mockDb({
      user: null,
      account: null,
    });

    const result = await resolveGoogleLinking({
      email: "new@example.com",
      providerAccountId: "google-789",
      db: db as any,
    });

    expect(result).toEqual({ action: "create-new" });
  });

  it("rejects linking when account is already bound to a different user", async () => {
    const db = mockDb({
      user: { id: "user-1", email: "owner@example.com" },
      account: { userId: "user-2" },
    });

    const result = await resolveGoogleLinking({
      email: "owner@example.com",
      providerAccountId: "google-123",
      db: db as any,
    });

    expect(result).toEqual({ action: "reject" });
  });
});
