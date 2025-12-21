import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  assertMembership,
  WorkspaceAccessError,
} from "../../src/lib/repositories/workspaceRepo";

describe("assertMembership", () => {
  it("throws when membership is missing", async () => {
    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce(null);

    await expect(
      assertMembership({ userId: "user_1", workspaceId: "ws_1" })
    ).rejects.toBeInstanceOf(WorkspaceAccessError);
  });

  it("does not throw when membership exists", async () => {
    vi.mocked(db.workspaceMember.findUnique).mockResolvedValueOnce({
      userId: "user_1",
    });

    await expect(
      assertMembership({ userId: "user_1", workspaceId: "ws_1" })
    ).resolves.toBeUndefined();
  });
});
