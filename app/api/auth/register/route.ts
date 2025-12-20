import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/auth/utils";
import { db } from "@/lib/db";
import { validateOrThrow } from "@/lib/validators";
import { registerSchema } from "@/lib/validators/auth";

interface ApiUser {
  id: string;
  email: string;
  name: string | null;
}

interface CredentialCreate {
  passwordHash: string;
}

interface CreateUserData {
  email: string;
  name?: string | null;
  credential: {
    create: CredentialCreate;
  };
}

interface UserCreateSelect {
  id: true;
  email: true;
  name: true;
}

interface TxUser {
  user: {
    create(args: {
      data: CreateUserData;
      select: UserCreateSelect;
    }): Promise<ApiUser>;
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const input = validateOrThrow(registerSchema, body);

  const email = normalizeEmail(input.email);
  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(input.password);

  const user: ApiUser = await db.$transaction((tx: TxUser) =>
    tx.user.create({
      data: {
        email,
        name: input.name ?? null,
        credential: {
          create: {
            passwordHash,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })
  );

  return NextResponse.json(user, { status: 201 });
}
