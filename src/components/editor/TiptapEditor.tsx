"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight/lib/common";

type TiptapEditorProps = {
  initialContent: JSONContent | null;
  onChange?: (content: JSONContent) => void;
};

const TiptapEditor = ({ initialContent, onChange }: TiptapEditorProps) => {
  const hydratedRef = useRef(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent ?? undefined,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  useEffect(() => {
    if (!editor || initialContent === null || hydratedRef.current) {
      return;
    }

    editor.commands.setContent(initialContent, false);
    hydratedRef.current = true;
  }, [editor, initialContent]);

  return (
    <div className="rounded-lg border bg-card p-4 text-sm text-foreground">
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
