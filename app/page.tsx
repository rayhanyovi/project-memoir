import { ComponentExample } from "@/components/component-example";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="A quick snapshot of your workspace components and patterns."
        action={
          <Button size="sm" variant="outline">
            Share
          </Button>
        }
      />
    </div>
  );
}
