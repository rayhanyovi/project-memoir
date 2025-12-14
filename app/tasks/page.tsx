import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

const sampleTasks = [
  { title: "Draft weekly recap", status: "In progress" },
  { title: "Tag new library entries", status: "Waiting" },
  { title: "Outline next essay", status: "Planned" },
]

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Keep track of what you need to do across journals and collections."
        action={<Button size="sm">Add task</Button>}
      />
      <div className="rounded-lg border">
        <ul className="divide-border divide-y">
          {sampleTasks.map((task) => (
            <li key={task.title} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-foreground">
                {task.title}
              </span>
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                {task.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
