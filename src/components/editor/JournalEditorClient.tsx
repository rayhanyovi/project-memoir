"use client";

import type { JSONContent } from "@tiptap/core";

import TiptapEditor from "./TiptapEditor";

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const JournalEditorClient = () => {
  return (
    <TiptapEditor
      initialContent={EMPTY_DOC}
      variant="plain"
      className="px-1"
      editorClassName="min-h-[480px] text-base leading-relaxed"
    />
  );
};

export default JournalEditorClient;
