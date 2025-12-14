import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export default function CollectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Group related notes, research, or ideas into reusable sets."
        action={<Button size="sm">Create collection</Button>}
      />
      <div className="rounded-lg border bg-card p-6">
        <div className="text-sm font-semibold">Flexible structure</div>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Build collections for themes, projects, or collaborators. Start small
          with a handful of items and expand as your work grows.
        </p>
      </div>
    </div>
  )
}
