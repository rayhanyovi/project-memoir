import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Capture daily notes, highlights, and reflections in one place."
        action={<Button size="sm">New entry</Button>}
      />
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Journaling tools will live here soon. Create entries, pin milestones,
        and organize your writing without losing context.
      </div>
    </div>
  )
}
