import type { PrismaClient } from "@prisma/client";

import { normalizeEmail } from "./utils";

type DbLike = Pick<PrismaClient, "user" | "account">;

type LinkDecision =
  | { action: "use-existing"; userId: string }
  | { action: "create-new" }
  | { action: "reject" };

export async function resolveGoogleLinking({
  email,
  providerAccountId,
  db,
}: {
  email?: string | null;
  providerAccountId: string;
  db: DbLike;
}): Promise<LinkDecision> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { action: "reject" };
  }

  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!existingUser) {
    return { action: "create-new" };
  }

  const existingAccount = await db.account.findFirst({
    where: { provider: "google", providerAccountId },
  });

  if (existingAccount && existingAccount.userId !== existingUser.id) {
    return { action: "reject" };
  }

  return { action: "use-existing", userId: existingUser.id };
}
