"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension, type Editor, type JSONContent } from "@tiptap/core";
import { FloatingMenu, BubbleMenu } from "@tiptap/react/menus";

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

import SlashCommand from "./extensions/slash-command";
import Mention from "./extensions/mention";
import { cn } from "@/lib/utils/cn";
import { hoverPlusHandlePlugin } from "./plugins/hover-plus-handle";
import { activeBlockPlugin } from "./plugins/active-block";
import { commandHintPlugin } from "./plugins/command-hint";

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

  const editor = useEditor({
    extensions: [
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
        name: "hoverPlusHandle",
        addProseMirrorPlugins() {
          return [hoverPlusHandlePlugin({ editor: this.editor })];
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
      Placeholder.configure({
        placeholder: 'Write, or press "/" for commands',
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      CharacterCount.configure({ limit: characterLimit }),
      Dropcursor,
      Gapcursor,
    ],

    content: initialContent ?? undefined,
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  // expose editor instance
  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  // hydrate once
  useEffect(() => {
    if (!editor || initialContent === null || hydratedRef.current) return;
    editor.commands.setContent(initialContent);
    hydratedRef.current = true;
  }, [editor, initialContent]);

  const wrapperClasses =
    variant === "plain"
      ? cn("tiptap-editor text-sm text-foreground", className)
      : cn(
          "tiptap-editor rounded-lg border bg-card p-4 text-sm text-foreground",
          className
        );

  return (
    <div className={wrapperClasses}>
      {editor && (
        <>
          {/* Bubble menu (text selection) */}
          <BubbleMenu
            editor={editor}
            // options={{ duration: 120, maxWidth: "none" }}
          >
            <div className="flex items-center gap-1 rounded-xl border bg-background/95 p-1 shadow-lg backdrop-blur">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-muted",
                  editor.isActive("bold") && "bg-muted"
                )}
                aria-label="Bold"
              >
                <span className="font-bold">B</span>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-muted",
                  editor.isActive("italic") && "bg-muted"
                )}
                aria-label="Italic"
              >
                <span className="italic">I</span>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-muted",
                  editor.isActive("underline") && "bg-muted"
                )}
                aria-label="Underline"
              >
                <span className="underline">U</span>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-muted",
                  editor.isActive("strike") && "bg-muted"
                )}
                aria-label="Strikethrough"
              >
                <span className="line-through">S</span>
              </button>

              <div className="mx-1 h-5 w-px bg-border" />

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition hover:bg-muted",
                  editor.isActive("code") && "bg-muted"
                )}
                aria-label="Inline code"
              >
                {"</>"}
              </button>
            </div>
          </BubbleMenu>

          {/* Floating menu (empty line) */}
          <FloatingMenu
            editor={editor}
            shouldShow={({ state }) => {
              const { $from } = state.selection;
              return (
                $from.parent.type.name === "paragraph" &&
                $from.parent.content.size === 0
              );
            }}
          >
            <div className="tiptap-floating-menu">
              <button
                onClick={() => editor.chain().focus().insertContent("/").run()}
                className="tiptap-floating-button"
                aria-label="Open commands"
              >
                ＋
              </button>
            </div>
          </FloatingMenu>
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
