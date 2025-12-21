import { z } from "zod";

export const MAX_TIPTAP_NODES = 5000;
export const MAX_TIPTAP_JSON_BYTES = 1_000_000;

export type ProseMirrorMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type ProseMirrorNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  text?: string;
  marks?: ProseMirrorMark[];
};

const ProseMirrorMarkSchema: z.ZodType<ProseMirrorMark> = z
  .object({
    type: z.string(),
    attrs: z.record(z.string(), z.any()).optional(),
  })
  .strict();

const ProseMirrorNodeSchema: z.ZodType<ProseMirrorNode> = z.lazy(() =>
  z
    .object({
      type: z.string(),
      attrs: z.record(z.string(), z.any()).optional(),
      content: z.array(ProseMirrorNodeSchema).optional(),
      text: z.string().optional(),
      marks: z.array(ProseMirrorMarkSchema).optional(),
    })
    .strict()
);

const countNodes = (node: ProseMirrorNode): number => {
  const children = node.content ?? [];
  return (
    1 +
    children.reduce((total, child) => {
      return total + countNodes(child);
    }, 0)
  );
};

export const ProseMirrorDocSchema = z
  .object({
    type: z.literal("doc"),
    attrs: z.record(z.string(), z.any()).optional(),
    content: z.array(ProseMirrorNodeSchema),
    text: z.string().optional(),
    marks: z.array(ProseMirrorMarkSchema).optional(),
  })
  .strict()
  .superRefine((doc, ctx) => {
  const totalNodes = countNodes(doc);
  if (totalNodes > MAX_TIPTAP_NODES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Content exceeds maximum node count of ${MAX_TIPTAP_NODES}`,
    });
  }

  try {
    const size = Buffer.byteLength(JSON.stringify(doc), "utf8");
    if (size > MAX_TIPTAP_JSON_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Content exceeds maximum size of ${MAX_TIPTAP_JSON_BYTES} bytes`,
      });
    }
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Content could not be serialized",
    });
  }
  });

export const UpdatePageSchema = z
  .object({
    title: z.string().trim().min(1, "title cannot be empty").optional(),
    content: ProseMirrorDocSchema.optional(),
    contentVersion: z.number().int().positive(),
  })
  .strict();
