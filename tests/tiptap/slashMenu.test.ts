import { describe, expect, it } from "vitest";

import {
  canTriggerSlashFromText,
  filterSlashItems,
  slashCommandItems,
} from "@/src/components/editor/menus/SlashMenu";

describe("filterSlashItems", () => {
  it("returns all commands when query is empty", () => {
    expect(filterSlashItems("")).toHaveLength(slashCommandItems.length);
  });

  it("matches title, description, and keywords", () => {
    expect(filterSlashItems("heading")).toHaveLength(2);
    expect(filterSlashItems("quote")).toHaveLength(1);
    expect(filterSlashItems("grid")[0]?.title).toBe("Table (3x3)");
    expect(filterSlashItems("checkbox")[0]?.title).toBe("To-do list");
  });
});

describe("canTriggerSlashFromText", () => {
  it("allows when only whitespace exists before trigger", () => {
    expect(
      canTriggerSlashFromText({ textBefore: "", isCodeBlock: false })
    ).toBe(true);
    expect(
      canTriggerSlashFromText({ textBefore: "   ", isCodeBlock: false })
    ).toBe(true);
  });

  it("blocks when text exists before trigger", () => {
    expect(
      canTriggerSlashFromText({ textBefore: "hello", isCodeBlock: false })
    ).toBe(false);
  });

  it("blocks in code blocks", () => {
    expect(
      canTriggerSlashFromText({ textBefore: "", isCodeBlock: true })
    ).toBe(false);
  });
});
