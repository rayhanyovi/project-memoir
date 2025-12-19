import { z } from "zod";

export const MAX_BLOCKS = 5000;

export const blockTypeSchema = z.enum([
  "paragraph",
  "heading",
  "todo",
  "bullet_list",
  "numbered_list",
  "quote",
  "code",
  "divider",
]);

export const blockSchema = z.lazy(() =>
  z
    .object({
      id: z.string().min(1, "id is required"),
      type: blockTypeSchema,
      props: z.record(z.string(), z.any()).optional(),
      children: z.array(blockSchema).default([]),
    })
    .strict()
);

const countBlocks = (blocks: BlocksInput): number =>
  blocks.reduce(
    (total, block) => total + 1 + countBlocks(block.children ?? []),
    0
  );

export const blocksSchema = z
  .array(blockSchema)
  .default([])
  .superRefine((blocks, ctx) => {
    const total = countBlocks(blocks);
    if (total > MAX_BLOCKS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Content exceeds maximum block count of ${MAX_BLOCKS}`,
      });
    }
  });

export type BlockType = z.infer<typeof blockTypeSchema>;
export type BlockInput = z.infer<typeof blockSchema>;
export type BlocksInput = z.infer<typeof blocksSchema>;
