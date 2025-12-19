import { describe, expect, it } from "vitest";

import { PrismaClient } from "@prisma/client";

describe("Prisma Client", () => {
  it("instantiates without connecting", async () => {
    process.env.DATABASE_URL ??=
      "postgresql://memoir:memoir-p@ssword@localhost:5433/memoir";

    const client = new PrismaClient();
    await client.$disconnect();

    expect(client).toBeInstanceOf(PrismaClient);
  });
});
