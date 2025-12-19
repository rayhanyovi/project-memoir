import { z } from "zod";

export const WORKSPACE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const workspaceRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "GUEST"]);

export const createWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    slug: z
      .string()
      .regex(WORKSPACE_SLUG_REGEX, "slug must be lowercase, alphanumeric, and hyphenated"),
  })
  .strict();

export const inviteMemberSchema = z
  .object({
    email: z.string().email(),
    role: workspaceRoleSchema,
  })
  .strict();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type WorkspaceRoleInput = z.infer<typeof workspaceRoleSchema>;
