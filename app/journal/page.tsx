import { PageHeader } from "@/components/layout/page-header"
import Tiptap from "@/components/tiptap"
import { Button } from "@/components/ui/button"

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Capture daily notes, highlights, and reflections in one place."
        action={<Button size="sm">New entry</Button>}
      />
      <Tiptap />
    </div>
  )
}
