import { describe, expect, it } from "vitest";

import {
  getNodeTypeOffset,
  shouldShowCommandHint,
} from "@/src/components/editor/utils/editorUi";

describe("getNodeTypeOffset", () => {
  it("returns offsets for headings by level", () => {
    expect(getNodeTypeOffset("heading", { level: 1 })).toEqual({
      top: 8,
      left: 0,
    });
    expect(getNodeTypeOffset("heading", { level: 2 })).toEqual({
      top: 6,
      left: 0,
    });
    expect(getNodeTypeOffset("heading", { level: 3 })).toEqual({
      top: 5,
      left: 0,
    });
  });

  it("returns offsets for list types", () => {
    expect(getNodeTypeOffset("bulletList")).toEqual({ top: 4, left: 12 });
    expect(getNodeTypeOffset("orderedList")).toEqual({ top: 4, left: 12 });
    expect(getNodeTypeOffset("taskList")).toEqual({ top: 4, left: 12 });
    expect(getNodeTypeOffset("listItem")).toEqual({ top: 4, left: 12 });
    expect(getNodeTypeOffset("taskItem")).toEqual({ top: 4, left: 12 });
  });

  it("returns offsets for block nodes", () => {
    expect(getNodeTypeOffset("blockquote")).toEqual({ top: 6, left: 0 });
    expect(getNodeTypeOffset("codeBlock")).toEqual({ top: 6, left: 0 });
    expect(getNodeTypeOffset("table")).toEqual({ top: 6, left: 0 });
  });

  it("returns default offsets for unknown nodes", () => {
    expect(getNodeTypeOffset("paragraph")).toEqual({ top: 4, left: 0 });
    expect(getNodeTypeOffset("unknown")).toEqual({ top: 4, left: 0 });
  });
});

describe("shouldShowCommandHint", () => {
  it("returns true for empty docs", () => {
    expect(shouldShowCommandHint({ type: "doc", content: [] })).toBe(true);
    expect(
      shouldShowCommandHint({
        type: "doc",
        content: [{ type: "paragraph", content: [] }],
      })
    ).toBe(true);
  });

  it("returns false when text exists", () => {
    expect(
      shouldShowCommandHint({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Hi" }] },
        ],
      })
    ).toBe(false);
  });

  it("returns true for invalid shapes", () => {
    expect(shouldShowCommandHint(null)).toBe(true);
    expect(shouldShowCommandHint({})).toBe(true);
  });
});
