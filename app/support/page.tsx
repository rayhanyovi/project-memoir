import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Need a hand? Find answers or send feedback."
        action={<Button size="sm" variant="outline">Contact us</Button>}
      />
      <div className="rounded-lg border bg-card p-6">
        <div className="text-sm font-semibold">Help center</div>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Browse setup guides, learn how to structure collections, and discover
          tips for keeping your journal tidy.
        </p>
      </div>
    </div>
  )
}
