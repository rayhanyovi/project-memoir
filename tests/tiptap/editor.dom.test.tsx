import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TiptapEditor from "@/src/components/editor/TiptapEditor";

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

describe("Tiptap editor UI hooks", () => {
  it("renders wrapper and placeholder on empty doc", async () => {
    const { container } = render(<TiptapEditor initialContent={EMPTY_DOC} />);

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror")).not.toBeNull();
    });

    expect(container.querySelector(".tiptap-editor")).not.toBeNull();
    expect(container.querySelector("p[data-placeholder]")).not.toBeNull();
  });

  it("adds active block class and selected node class", async () => {
    let editorRef: any = null;
    const { container } = render(
      <TiptapEditor initialContent={EMPTY_DOC} onReady={(editor) => (editorRef = editor)} />
    );

    await waitFor(() => {
      expect(editorRef).not.toBeNull();
    });

    editorRef.commands.focus();
    editorRef.commands.setTextSelection(1);

    await waitFor(() => {
      expect(container.querySelector(".memoir-active-block")).not.toBeNull();
    });

    editorRef.commands.setImage({ src: "https://example.com/image.png" });

    let imagePos: number | null = null;
    editorRef.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === "image") {
        imagePos = pos;
        return false;
      }
      return true;
    });

    expect(imagePos).not.toBeNull();
    editorRef.commands.setNodeSelection(imagePos);

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror-selectednode")).not.toBeNull();
    });
  });

  it("reassigns active block when selection moves", async () => {
    let editorRef: any = null;
    const { container } = render(
      <TiptapEditor
        initialContent={{
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "One" }] },
            { type: "paragraph", content: [{ type: "text", text: "Two" }] },
          ],
        }}
        onReady={(editor) => (editorRef = editor)}
      />
    );

    await waitFor(() => {
      expect(editorRef).not.toBeNull();
    });

    editorRef.commands.focus();
    editorRef.commands.setTextSelection(2);

    await waitFor(() => {
      expect(container.querySelectorAll(".memoir-active-block").length).toBe(1);
    });

    editorRef.commands.setTextSelection(6);

    await waitFor(() => {
      const active = container.querySelector(".memoir-active-block");
      expect(active?.textContent).toContain("Two");
    });
  });
});
