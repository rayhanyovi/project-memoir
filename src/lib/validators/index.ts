import { z } from "zod";

export { blockSchema, blocksSchema, blockTypeSchema, MAX_BLOCKS } from "./block";
export { createPageSchema, updatePageSchema } from "./page";
export {
  createWorkspaceSchema,
  inviteMemberSchema,
  workspaceRoleSchema,
  WORKSPACE_SLUG_REGEX,
} from "./workspace";
export { credentialsSchema, registerSchema } from "./auth";

export type { BlockInput, BlockType, BlocksInput } from "./block";
export type { CreatePageInput, UpdatePageInput } from "./page";
export type {
  CreateWorkspaceInput,
  InviteMemberInput,
  WorkspaceRoleInput,
} from "./workspace";
export type { CredentialsInput, RegisterInput } from "./auth";

export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}
