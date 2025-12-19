import { z } from "zod";

const PASSWORD_MAX = 72; // keep bcrypt-safe upper bound; argon2 also fine.

export const credentialsSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8, "Password must be at least 8 characters").max(PASSWORD_MAX),
  })
  .strict();

export const registerSchema = credentialsSchema
  .extend({
    name: z.string().trim().min(1, "Name cannot be empty").max(120).optional(),
  })
  .strict();

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
