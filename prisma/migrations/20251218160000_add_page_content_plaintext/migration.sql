-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "content" SET DEFAULT '{}'::jsonb;
ALTER TABLE "Page" ADD COLUMN "plainText" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Page_workspaceId_updatedAt_idx" ON "Page"("workspaceId", "updatedAt");
