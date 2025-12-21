import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { assertMembership, WorkspaceAccessError } from "@/src/lib/repositories/workspaceRepo";
import { setActiveWorkspaceCookie } from "@/src/lib/workspace/activeWorkspace";
import { SwitchWorkspaceSchema } from "@/src/lib/validators/workspace";

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

  const parsed = SwitchWorkspaceSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await assertMembership({
      userId,
      workspaceId: parsed.data.workspaceId,
    });
  } catch (error) {
    if (error instanceof WorkspaceAccessError && error.status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw error;
  }

  await setActiveWorkspaceCookie(parsed.data.workspaceId);

  return NextResponse.json({
    activeWorkspaceId: parsed.data.workspaceId,
  });
}
