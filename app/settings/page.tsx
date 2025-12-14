import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure Memoir to match how you work."
        action={<Button size="sm" variant="outline">Manage profile</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <div className="text-sm font-semibold">Theme</div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Toggle between light and dark, or match your system preference.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="text-sm font-semibold">Notifications</div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Decide when you want reminders or digests for journal and task
            updates.
          </p>
        </div>
      </div>
    </div>
  )
}
