import { describe, expect, it } from "vitest";

import { MAX_BLOCKS } from "../../src/lib/validators/block";
import { createPageSchema } from "../../src/lib/validators/page";

describe("createPageSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = createPageSchema.parse({
      workspaceId: "ws_123",
      title: "First page",
      content: [
        {
          id: "block-1",
          type: "paragraph",
          props: { text: "Hello world" },
        },
      ],
      contentVersion: 1,
    });

    expect(parsed.title).toBe("First page");
    expect(parsed.content).toHaveLength(1);
  });

  it("rejects empty titles", () => {
    expect(() =>
      createPageSchema.parse({
        workspaceId: "ws_123",
        title: "   ",
        content: [],
        contentVersion: 1,
      })
    ).toThrow();
  });

  it("rejects payloads when content exceeds the max block count", () => {
    const oversized = Array.from({ length: MAX_BLOCKS + 1 }, (_, index) => ({
      id: `block-${index}`,
      type: "paragraph" as const,
      children: [],
    }));

    expect(() =>
      createPageSchema.parse({
        workspaceId: "ws_123",
        title: "Too big",
        content: oversized,
        contentVersion: 1,
      })
    ).toThrow(/maximum block count/i);
  });
});
