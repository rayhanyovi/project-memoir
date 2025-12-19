import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";

import { db } from "../db";
import { normalizeEmail } from "./utils";

export function createAuthAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(db) as Adapter;
  const originalCreateUser = baseAdapter.createUser;
  const originalLinkAccount = baseAdapter.linkAccount;

  return {
    ...baseAdapter,
    async createUser(data) {
      const normalizedEmail = normalizeEmail(data.email);
      if (normalizedEmail) {
        const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
          return existingUser;
        }
      }

      if (!originalCreateUser) {
        throw new Error("Adapter missing createUser implementation");
      }

      return originalCreateUser({
        ...data,
        email: normalizedEmail ?? data.email,
      });
    },
    async linkAccount(account) {
      if (!originalLinkAccount) {
        throw new Error("Adapter missing linkAccount implementation");
      }

      const existingAccount = await db.account.findFirst({
        where: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      });

      if (existingAccount && existingAccount.userId !== account.userId) {
        throw new Error("Account already linked to a different user");
      }

      return originalLinkAccount(account);
    },
  };
}
