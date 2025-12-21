import { describe, expect, it } from "vitest";

import { ProseMirrorDocSchema } from "../../src/lib/validators/tiptap";

describe("ProseMirrorDocSchema", () => {
  it("accepts a valid doc with paragraphs and headings", () => {
    const parsed = ProseMirrorDocSchema.parse({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Hello" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "World" }],
        },
      ],
    });

    expect(parsed.type).toBe("doc");
    expect(parsed.content).toHaveLength(2);
  });

  it("accepts an empty doc", () => {
    const parsed = ProseMirrorDocSchema.parse({ type: "doc", content: [] });
    expect(parsed.content).toHaveLength(0);
  });

  it("rejects missing root type", () => {
    expect(() =>
      ProseMirrorDocSchema.parse({ content: [] })
    ).toThrow();
  });

  it("rejects non-array content", () => {
    expect(() =>
      ProseMirrorDocSchema.parse({ type: "doc", content: {} })
    ).toThrow();
  });

  it("rejects nodes without a type", () => {
    expect(() =>
      ProseMirrorDocSchema.parse({
        type: "doc",
        content: [{ text: "Hello" }],
      })
    ).toThrow();
  });
});
