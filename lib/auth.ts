import { getServerSession, type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { createAuthAdapter } from "./auth/adapter";
import { resolveGoogleLinking } from "./auth/linking";
import { verifyPassword } from "./auth/password";
import { normalizeEmail } from "./auth/utils";
import { db } from "./db";
import { credentialsSchema } from "./validators/auth";

export const authOptions: AuthOptions = {
  adapter: createAuthAdapter(),
  session: {
    strategy: "database",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: normalizeEmail(profile.email),
          image: profile.picture,
          emailVerified: profile.email_verified ?? null,
        };
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        console.log(
          "[auth] authorize keys:",
          Object.keys(rawCredentials ?? {})
        );

        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          console.log("[auth] zod failed:", parsed.error.flatten());

          return null;
        }

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email },
          include: { credential: true },
        });

        if (!user || !user.credential) {
          return null;
        }

        const valid = await verifyPassword(
          user.credential.passwordHash,
          password
        );
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const emailVerified = (
          profile as { email_verified?: boolean } | undefined
        )?.email_verified;
        if (emailVerified === false) {
          return false;
        }

        const decision = await resolveGoogleLinking({
          email: user.email,
          providerAccountId: account.providerAccountId,
          db,
        });

        if (decision.action === "reject") {
          return false;
        }

        if (decision.action === "use-existing") {
          (user as { id?: string }).id = decision.userId;
        }
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.email =
          normalizeEmail(user.email) ?? user.email ?? undefined;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export const auth = () => getServerSession(authOptions);
