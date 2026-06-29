import { authCookieName } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL("/", req.url));
  
  // Dynamic cookie settings based on protocol
  const protocol = req.url.startsWith('https:') ? 'https' : 'http';
  const isSecure = protocol === 'https';
  const sameSite = isSecure ? 'none' : 'lax';
  
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: isSecure,          // true for HTTPS, false for HTTP
    sameSite: sameSite,        // "none" for HTTPS, "lax" for HTTP
    path: "/",
    maxAge: 0                  // Delete cookie
  });
  return response;
}
