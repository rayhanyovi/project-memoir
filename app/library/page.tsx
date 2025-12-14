import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Collect articles, research, and snippets you want to reference later."
        action={<Button size="sm">Add resource</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <div className="text-sm font-semibold">Reading queue</div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Track what you want to read next and mark items as finished when
            you are done.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="text-sm font-semibold">Highlights</div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Save memorable quotes or concepts to revisit during your next
            session.
          </p>
        </div>
      </div>
    </div>
  )
}
