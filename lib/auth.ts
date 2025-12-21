import { headers } from "next/headers";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { db } from "./db";
import { hashPassword, verifyPassword } from "./auth/password";

export const auth = betterAuth({
  appName: "Memoir",
  basePath: "/api/auth",
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(hash, password),
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  user: {
    modelName: "User",
    fields: {
      image: "avatarUrl",
    },
  },
  session: {
    modelName: "Session",
    fields: {
      token: "sessionToken",
      expiresAt: "expires",
      userId: "userId",
      ipAddress: "ipAddress",
      userAgent: "userAgent",
    },
  },
  account: {
    modelName: "Account",
    fields: {
      providerId: "provider",
      accountId: "providerAccountId",
      userId: "userId",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "accessTokenExpiresAt",
      refreshTokenExpiresAt: "refreshTokenExpiresAt",
      idToken: "id_token",
      scope: "scope",
      password: "password",
    },
  },
  verification: {
    modelName: "VerificationToken",
    fields: {
      value: "token",
      expiresAt: "expires",
      identifier: "identifier",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
  plugins: [nextCookies()],
});

export const getSession = async () => {
  const headerList = await headers();
  try {
    return await auth.api.getSession({ headers: headerList });
  } catch {
    return null;
  }
};
