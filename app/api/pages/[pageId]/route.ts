import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractPlainText } from "@/src/lib/tiptap/extractPlainText";
import { UpdatePageSchema } from "@/src/lib/validators/tiptap";

type RouteParams = {
  params: Promise<{
    pageId: string;
  }>;
};

const ensureWorkspaceAccess = async (pageId: string, userId: string) => {
  const page = await db.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      content: true,
      contentVersion: true,
      updatedAt: true,
    },
  });

  if (!page) {
    return { error: "not_found" as const };
  }

  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: page.workspaceId,
        userId,
      },
    },
    select: { userId: true },
  });

  if (!membership) {
    return { error: "forbidden" as const };
  }

  return { page };
};

const ensureDocShape = (content: unknown) => {
  if (
    content &&
    typeof content === "object" &&
    (content as { type?: unknown }).type === "doc" &&
    Array.isArray((content as { content?: unknown }).content)
  ) {
    const doc = content as { type: string; content: unknown[] };
    if (doc.content.length === 0) {
      return { type: "doc", content: [{ type: "paragraph" }] };
    }
    return doc;
  }

  return { type: "doc", content: [{ type: "paragraph" }] };
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { pageId } = await params;
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await ensureWorkspaceAccess(pageId, userId);
  if ("error" in access) {
    return NextResponse.json(
      { error: access.error === "not_found" ? "Not found" : "Forbidden" },
      { status: access.error === "not_found" ? 404 : 403 }
    );
  }

  const { page } = access;

  return NextResponse.json({
    id: page.id,
    title: page.title,
    content: ensureDocShape(page.content),
    contentVersion: page.contentVersion,
    updatedAt: page.updatedAt,
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { pageId } = await params;
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await ensureWorkspaceAccess(pageId, userId);
  if ("error" in access) {
    return NextResponse.json(
      { error: access.error === "not_found" ? "Not found" : "Forbidden" },
      { status: access.error === "not_found" ? 404 : 403 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdatePageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, content, contentVersion } = parsed.data;
  if (title === undefined && content === undefined) {
    return NextResponse.json(
      { error: "No update fields provided" },
      { status: 400 }
    );
  }

  const data: {
    title?: string;
    content?: unknown;
    plainText?: string;
    contentVersion?: number;
  } = {};

  if (title !== undefined) {
    data.title = title;
  }

  if (content !== undefined) {
    data.content = content;
    data.plainText = extractPlainText(content);
    data.contentVersion = contentVersion + 1;
  }

  const updated = await db.page.update({
    where: { id: pageId },
    data,
    select: {
      contentVersion: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    contentVersion: updated.contentVersion,
    updatedAt: updated.updatedAt,
  });
}
