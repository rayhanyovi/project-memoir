import { db } from "@/lib/db";
import { makeUniqueSlug, slugify } from "@/src/lib/slug";

export type WorkspaceListItem = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export class WorkspaceAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const listWorkspacesForUser = async (
  userId: string
): Promise<WorkspaceListItem[]> => {
  const memberships = await db.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((member) => ({
    id: member.workspace.id,
    name: member.workspace.name,
    slug: member.workspace.slug,
    role: member.role,
  }));
};

export const createWorkspaceForOwner = async ({
  userId,
  name,
  slug,
}: {
  userId: string;
  name: string;
  slug?: string;
}): Promise<WorkspaceListItem> => {
  const baseSlug = slug?.trim() ? slug : slugify(name);
  const uniqueSlug = await makeUniqueSlug(baseSlug, async (candidate) => {
    const existing = await db.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return Boolean(existing);
  });

  const workspace = await db.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: { name, slug: uniqueSlug },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: created.id,
        userId,
        role: "OWNER",
      },
    });

    return created;
  });

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role: "OWNER",
  };
};

export const assertMembership = async ({
  userId,
  workspaceId,
}: {
  userId: string;
  workspaceId: string;
}) => {
  const membership = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { userId: true },
  });

  if (!membership) {
    throw new WorkspaceAccessError("Forbidden", 403);
  }
};

export const ensureDefaultWorkspace = async (
  userId: string
): Promise<WorkspaceListItem> => {
  const membership = await db.workspaceMember.findFirst({
    where: { userId },
    select: {
      role: true,
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    return {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
    };
  }

  return createWorkspaceForOwner({
    userId,
    name: "My Workspace",
  });
};
