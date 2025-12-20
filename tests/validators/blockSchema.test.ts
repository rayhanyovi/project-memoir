import { describe, expect, it } from "vitest";

import { MAX_BLOCKS, blockSchema, blocksSchema } from "../../lib/validators/block";

describe("blockSchema", () => {
  it("accepts valid nested blocks", () => {
    const parsed = blockSchema.parse({
      id: "root-1",
      type: "heading",
      props: { level: 2, text: "Heading" },
      children: [
        { id: "child-1", type: "paragraph", props: { text: "Hello" } },
        {
          id: "child-2",
          type: "todo",
          props: { checked: false },
          children: [{ id: "grandchild-1", type: "paragraph", props: { text: "Nested" } }],
        },
      ],
    });

    expect(parsed.children).toHaveLength(2);
    expect(parsed.children[1]?.children).toHaveLength(1);
  });

  it("rejects missing id", () => {
    expect(() =>
      blockSchema.parse({
        type: "paragraph",
        children: [],
      })
    ).toThrow();
  });

  it("rejects unknown type", () => {
    expect(() =>
      blockSchema.parse({
        id: "block-1",
        type: "unknown",
        children: [],
      })
    ).toThrow();
  });

  it("rejects extra keys in block object", () => {
    expect(() =>
      blockSchema.parse({
        id: "block-2",
        type: "quote",
        children: [],
        unexpected: true,
      })
    ).toThrow();
  });

  it("handles empty content arrays", () => {
    const result = blocksSchema.parse([]);
    expect(result).toEqual([]);
  });

  it("rejects content beyond the configured max block count", () => {
    const largeContent = Array.from({ length: MAX_BLOCKS + 1 }, (_, index) => ({
      id: `block-${index}`,
      type: "paragraph" as const,
      children: [],
    }));

    expect(() =>
      blocksSchema.parse(largeContent)
    ).toThrow(/maximum block count/i);
  });
});
