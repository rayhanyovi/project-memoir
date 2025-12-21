import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  createWorkspaceForOwner,
  ensureDefaultWorkspace,
  listWorkspacesForUser,
} from "@/src/lib/repositories/workspaceRepo";
import { getActiveWorkspaceIdFromCookies, setActiveWorkspaceCookie } from "@/src/lib/workspace/activeWorkspace";
import { CreateWorkspaceSchema } from "@/src/lib/validators/workspace";

export async function GET() {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaces = await listWorkspacesForUser(userId);
  if (workspaces.length === 0) {
    const created = await ensureDefaultWorkspace(userId);
    workspaces = [created];
  }

  const activeIdFromCookie = await getActiveWorkspaceIdFromCookies();
  const activeWorkspaceId = workspaces.some(
    (workspace) => workspace.id === activeIdFromCookie
  )
    ? activeIdFromCookie
    : workspaces[0]?.id ?? null;

  if (activeWorkspaceId) {
    await setActiveWorkspaceCookie(activeWorkspaceId);
  }

  return NextResponse.json({
    activeWorkspaceId,
    workspaces,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateWorkspaceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const workspace = await createWorkspaceForOwner({
      userId,
      name: parsed.data.name,
      slug: parsed.data.slug,
    });

    await setActiveWorkspaceCookie(workspace.id);

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Workspace slug collision" },
      { status: 409 }
    );
  }
}
