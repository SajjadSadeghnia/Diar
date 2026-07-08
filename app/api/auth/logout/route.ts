import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Behind the nginx reverse proxy, req.url reflects the internal bind
  // address (http://localhost:3000), so the redirect target must be rebuilt
  // from the forwarded headers to point at the public origin (diar.life).
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (req.url.startsWith("https:") ? "https" : "http");
  const isSecure = proto === "https";

  const target = host ? `${proto}://${host}/` : new URL("/", req.url);
  // 303 See Other: the logout form POST must be followed by a GET to "/"
  const response = NextResponse.redirect(target, 303);

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: isSecure,          // true for HTTPS, false for HTTP
    sameSite: isSecure ? "none" : "lax",
    path: "/",
    maxAge: 0,                 // Delete cookie
  });
  return response;
}
