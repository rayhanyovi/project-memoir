import { describe, expect, it } from "vitest";

import { extractPlainText } from "../../src/lib/tiptap/extractPlainText";

describe("extractPlainText", () => {
  it("extracts text from nested nodes", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world" },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item 1" }],
                },
              ],
            },
          ],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe("Hello world\nItem 1");
  });

  it("handles task lists and code blocks", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Buy milk" }],
                },
              ],
            },
          ],
        },
        {
          type: "codeBlock",
          content: [{ type: "text", text: "const x = 1;" }],
        },
      ],
    };

    expect(extractPlainText(doc)).toBe("Buy milk\nconst x = 1;");
  });

  it("never throws on unknown nodes", () => {
    const doc = {
      type: "doc",
      content: [{ type: "mystery", text: "Secret" }],
    };

    expect(() => extractPlainText(doc)).not.toThrow();
    expect(extractPlainText(doc)).toBe("Secret");
  });
});
