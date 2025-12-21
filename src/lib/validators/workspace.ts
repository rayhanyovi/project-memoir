import { z } from "zod";

export const WORKSPACE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CreateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    slug: z
      .string()
      .regex(WORKSPACE_SLUG_REGEX, "Invalid slug")
      .optional(),
  })
  .strict();

export const SwitchWorkspaceSchema = z
  .object({
    workspaceId: z.union([z.string().cuid(), z.string().uuid()]),
  })
  .strict();

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type SwitchWorkspaceInput = z.infer<typeof SwitchWorkspaceSchema>;
