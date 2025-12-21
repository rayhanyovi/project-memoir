"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension, type Editor, type JSONContent } from "@tiptap/core";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

import BubbleToolbar from "./menus/BubbleToolbar";
import SlashCommand from "./extensions/slash-command";
import Mention from "./extensions/mention";
import { cn } from "@/lib/utils/cn";
import { activeBlockPlugin } from "./plugins/active-block";
import { commandHintPlugin } from "./plugins/command-hint";
import { blockDndPlugin } from "./plugins/block-dnd";
import { domBlockWrapperPlugin } from "./plugins/dom-block-wrapper";

type TiptapEditorProps = {
  initialContent: JSONContent | null;
  onChange?: (content: JSONContent) => void;
  onReady?: (editor: Editor) => void;
  variant?: "card" | "plain";
  className?: string;
  editorClassName?: string;
  characterLimit?: number;
};

const TiptapEditor = ({
  initialContent,
  onChange,
  onReady,
  variant = "card",
  className,
  editorClassName,
  characterLimit = 10_000,
}: TiptapEditorProps) => {
  const lowlight = useMemo(() => createLowlight(common), []);
  const hydratedRef = useRef(false);
  const skipNextUpdateRef = useRef(true);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    hydratedRef.current = false;
    skipNextUpdateRef.current = true;
  }, [initialContent]);

  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      if (skipNextUpdateRef.current) {
        skipNextUpdateRef.current = false;
        return;
      }
      onChangeRef.current?.(editor.getJSON());
    },
    []
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
        underline: false,
        link: false,
      }),

      // Formatting
      Underline,
      Highlight,
      Typography,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),

      // Links & media
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),

      // Lists & tables
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,

      // Code
      CodeBlockLowlight.configure({ lowlight }),

      // UX
      Mention,
      SlashCommand,
      Extension.create({
        name: "blockDnd",
        addProseMirrorPlugins() {
          return [blockDndPlugin()];
        },
      }),
      Extension.create({
        name: "blockDnd",
        addProseMirrorPlugins() {
          return [blockDndPlugin()];
        },
      }),
      Extension.create({
        name: "activeBlock",
        addProseMirrorPlugins() {
          return [activeBlockPlugin()];
        },
      }),
      Extension.create({
        name: "commandHint",
        addProseMirrorPlugins() {
          return [commandHintPlugin()];
        },
      }),
      Extension.create({
        name: "domBlockWrapper",
        addProseMirrorPlugins() {
          return [domBlockWrapperPlugin({ editor: this.editor })];
        },
      }),
      Placeholder.configure({
        placeholder: 'Write, or press "/" for commands',
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      CharacterCount.configure({ limit: characterLimit }),
      Dropcursor,
      Gapcursor,
    ],
    [characterLimit, lowlight]
  );

  const editor = useEditor(
    {
      extensions,
      content: initialContent ?? undefined,
      immediatelyRender: false,
      onUpdate: handleUpdate,
    },
    [extensions, handleUpdate]
  );

  // expose editor instance
  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  // hydrate once
  useEffect(() => {
    if (!editor || initialContent === null || hydratedRef.current) return;
    skipNextUpdateRef.current = true;
    editor.commands.setContent(initialContent);
    hydratedRef.current = true;
  }, [editor, initialContent]);

  const wrapperClasses =
    variant === "plain"
      ? cn("tiptap-editor text-sm text-foreground", className)
      : cn(
          "tiptap-editor relative rounded-lg border bg-card p-4 text-sm text-foreground",
          className
        );

  return (
    <div className={wrapperClasses}>
      {editor && (
        <>
          <BubbleToolbar editor={editor} />
        </>
      )}

      <EditorContent
        editor={editor}
        className={cn("min-h-[320px] outline-none", editorClassName)}
      />
    </div>
  );
};

export default TiptapEditor;
