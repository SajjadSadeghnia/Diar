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

  // Static uploads served from public/
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login"];

  // Allow access to login page
  if (publicRoutes.includes(pathname)) {
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

  // Admin home: use dashboard instead of employee homepage
  if (pathname === "/" && role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|brand).*)"],
};
