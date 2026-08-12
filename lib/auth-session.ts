import { NextResponse } from "next/server";
import { authCookieName, getCurrentUser, type JwtPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ActiveUser = JwtPayload & { active: true };

type AuthSuccess = { user: ActiveUser };
type AuthFailure = { response: NextResponse };

async function loadActiveUser(jwt: JwtPayload | null): Promise<ActiveUser | null> {
  if (!jwt) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: jwt.userId },
    select: { active: true, role: true, name: true },
  });

  if (!dbUser?.active) return null;
  return { ...jwt, role: dbUser.role, name: dbUser.name, active: true };
}

function inactiveResponse(): NextResponse {
  const response = NextResponse.json({ error: "حساب کاربری شما غیرفعال شده است" }, { status: 403 });
  response.cookies.delete(authCookieName);
  return response;
}

/** API routes: require a valid JWT and an active user row in the database. */
export async function requireActiveUser(): Promise<AuthSuccess | AuthFailure> {
  const jwt = await getCurrentUser();
  if (!jwt) {
    return { response: NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 }) };
  }

  const user = await loadActiveUser(jwt);
  if (!user) {
    return { response: inactiveResponse() };
  }

  return { user };
}

/** API routes: require an active admin. */
export async function requireAdminUser(): Promise<AuthSuccess | AuthFailure> {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth;
  if (auth.user.role !== "admin") {
    return { response: NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 }) };
  }
  return auth;
}

/** Server Actions: throws on failure (use in try/catch or redirect). */
export async function requireAdminAction(): Promise<ActiveUser> {
  const jwt = await getCurrentUser();
  if (!jwt || jwt.role !== "admin") {
    throw new Error("دسترسی غیرمجاز");
  }

  const user = await loadActiveUser(jwt);
  if (!user) {
    throw new Error("حساب کاربری شما غیرفعال شده است");
  }

  return user;
}
