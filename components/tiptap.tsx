"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

export default function Tiptap() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Hello World! </p>",
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  })

  return (
    <div className="rounded-lg border bg-card p-4 text-sm text-foreground">
      <EditorContent editor={editor} />
    </div>
  )
}
