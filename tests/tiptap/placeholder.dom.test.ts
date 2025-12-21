import { Editor, Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

import { commandHintPlugin } from "@/src/components/editor/plugins/command-hint";

describe("placeholder and hint serialization", () => {
  it("does not persist placeholder or hint text into JSON", () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({ codeBlock: false, dropcursor: false }),
        Placeholder.configure({ placeholder: "Write here" }),
        Extension.create({
          name: "commandHint",
          addProseMirrorPlugins() {
            return [commandHintPlugin()];
          },
        }),
      ],
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    });

    const json = editor.getJSON();
    const serialized = JSON.stringify(json);

    expect(serialized).not.toContain("Write here");
    expect(serialized).not.toContain("Type / for commands");
    expect(serialized).not.toContain("data-hint");

    editor.destroy();
  });
});
