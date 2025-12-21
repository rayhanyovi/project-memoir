import type React from "react";
import { useCallback, useMemo } from "react";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

type BubbleToolbarProps = {
  editor: Editor;
};

type BubbleAction = {
  label: string;
  icon: React.ReactNode;
  isActive: () => boolean;
  onClick: () => void;
  ariaLabel: string;
};

const BubbleToolbar = ({ editor }: BubbleToolbarProps) => {
  const handleLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", previousUrl ?? "");
    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .setLink({ href: url.trim(), target: "_blank" })
      .run();
  }, [editor]);

  const actions = useMemo<BubbleAction[]>(
    () => [
      {
        label: "Bold",
        icon: <Bold className="h-4 w-4" />,
        isActive: () => editor.isActive("bold"),
        onClick: () => editor.chain().focus().toggleBold().run(),
        ariaLabel: "Bold",
      },
      {
        label: "Italic",
        icon: <Italic className="h-4 w-4" />,
        isActive: () => editor.isActive("italic"),
        onClick: () => editor.chain().focus().toggleItalic().run(),
        ariaLabel: "Italic",
      },
      {
        label: "Underline",
        icon: <Underline className="h-4 w-4" />,
        isActive: () => editor.isActive("underline"),
        onClick: () => editor.chain().focus().toggleUnderline().run(),
        ariaLabel: "Underline",
      },
      {
        label: "Strike",
        icon: <Strikethrough className="h-4 w-4" />,
        isActive: () => editor.isActive("strike"),
        onClick: () => editor.chain().focus().toggleStrike().run(),
        ariaLabel: "Strikethrough",
      },
      {
        label: "Code",
        icon: <Code className="h-4 w-4" />,
        isActive: () => editor.isActive("code"),
        onClick: () => editor.chain().focus().toggleCode().run(),
        ariaLabel: "Inline code",
      },
      {
        label: "Quote",
        icon: <Quote className="h-4 w-4" />,
        isActive: () => editor.isActive("blockquote"),
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        ariaLabel: "Blockquote",
      },
      {
        label: "Bulleted list",
        icon: <List className="h-4 w-4" />,
        isActive: () => editor.isActive("bulletList"),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        ariaLabel: "Bulleted list",
      },
      {
        label: "Numbered list",
        icon: <ListOrdered className="h-4 w-4" />,
        isActive: () => editor.isActive("orderedList"),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        ariaLabel: "Numbered list",
      },
      {
        label: "Link",
        icon: <Link2 className="h-4 w-4" />,
        isActive: () => editor.isActive("link"),
        onClick: handleLink,
        ariaLabel: "Link",
      },
    ],
    [editor, handleLink]
  );

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { from, to } = state.selection;
        return from !== to;
      }}
    >
      <div className="memoir-bubble-menu">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={cn(
              "memoir-bubble-button",
              action.isActive() && "is-active"
            )}
            aria-label={action.ariaLabel}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </BubbleMenu>
  );
};

export default BubbleToolbar;
