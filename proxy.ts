import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookieName } from "@/lib/auth";

function decodeRoleFromToken(token: string): "admin" | "employee" | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (decoded?.role === "admin" || decoded?.role === "employee") return decoded.role;
    return null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(authCookieName)?.value;
  const { pathname } = request.nextUrl;

  // Receipt images must go through authenticated API — block direct public access
  if (pathname.startsWith("/uploads/receipts/")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Property images only (still internal app — requires login except login page assets)
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  // /login: already-authenticated visitors get bounced to their home
  if (pathname === "/login") {
    if (token) {
      const role = decodeRoleFromToken(token);
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (role === "employee") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // "/": public homepage for everyone, including logged-out visitors.
  // Admins get bounced to /admin; employees see it as their home page.
  if (pathname === "/") {
    if (token) {
      const role = decodeRoleFromToken(token);
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  // Check if user is authenticated for all other routes
  if (!token) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate token and role
  const role = decodeRoleFromToken(token);
  if (!role) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(authCookieName);
    return response;
  }

  // Employee cannot access admin area
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|uploads|brand).*)"],
};
