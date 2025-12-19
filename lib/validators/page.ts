import { z } from "zod";

import { blocksSchema } from "./block";

export const createPageSchema = z
  .object({
    workspaceId: z.string().min(1, "workspaceId is required"),
    title: z.string().trim().min(1, "title cannot be empty"),
    content: blocksSchema,
    contentVersion: z.number().int().positive().default(1),
  })
  .strict();

export const updatePageSchema = z
  .object({
    title: z.string().trim().min(1, "title cannot be empty").optional(),
    content: blocksSchema.optional(),
    contentVersion: z.number().int().positive().optional(),
  })
  .strict();

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
