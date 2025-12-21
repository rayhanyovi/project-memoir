import { cookies } from "next/headers";

const COOKIE_NAME = "memoir_active_workspace";

export const getActiveWorkspaceIdFromCookies = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
};

export const setActiveWorkspaceCookie = async (workspaceId: string) => {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
};
