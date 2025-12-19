import { db } from "../db";
import { CreatePageInput, UpdatePageInput } from "../validators/page";

type CreatePagePayload = CreatePageInput & {
  authorId?: string | null;
};

type UpdatePagePayload = UpdatePageInput & {
  pageId: string;
};

export async function createPage({
  workspaceId,
  authorId,
  title,
  content,
  contentVersion,
}: CreatePagePayload) {
  return db.page.create({
    data: {
      workspaceId,
      authorId: authorId ?? null,
      title,
      content,
      contentVersion,
    },
  });
}

export async function updatePage({
  pageId,
  title,
  content,
  contentVersion,
}: UpdatePagePayload) {
  const data: Partial<{
    title: string;
    content: unknown;
    contentVersion: number;
  }> = {};

  if (title !== undefined) {
    data.title = title;
  }

  if (content !== undefined) {
    data.content = content;
  }

  if (contentVersion !== undefined) {
    data.contentVersion = contentVersion;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No update fields provided");
  }

  return db.page.update({
    where: { id: pageId },
    data,
  });
}
