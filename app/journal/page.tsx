import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractPlainText } from "@/src/lib/tiptap/extractPlainText";

const createJournalEntry = async () => {
  "use server";

  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/login");
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });

  if (!membership) {
    throw new Error("No workspace membership found.");
  }

  const content = { type: "doc", content: [] };
  const page = await db.page.create({
    data: {
      workspaceId: membership.workspaceId,
      authorId: userId,
      title: "New entry",
      content,
      plainText: extractPlainText(content),
    },
    select: { id: true },
  });

  redirect(`/pages/${page.id}`);
};

export default async function JournalPage() {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/login");
  }

  const pages = await db.page.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal"
        description="Capture daily notes, highlights, and reflections in one place."
        action={
          <form action={createJournalEntry}>
            <Button size="sm" type="submit">
              New entry
            </Button>
          </form>
        }
      />
      <div className="space-y-2">
        {pages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No entries yet. Create your first journal entry.
          </div>
        ) : (
          pages.map((page) => (
            <Link
              key={page.id}
              href={`/pages/${page.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm transition hover:bg-muted/60"
            >
              <div className="font-medium text-foreground">
                {page.title || "Untitled entry"}
              </div>
              <div className="text-xs text-muted-foreground">
                {page.updatedAt.toLocaleDateString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
