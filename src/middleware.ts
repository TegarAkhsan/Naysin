import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protected paths requiring login
  const isProtectedPath =
    path.startsWith("/dashboard") ||
    path.startsWith("/ingredients") ||
    path.startsWith("/stock") ||
    path.startsWith("/menus") ||
    path.startsWith("/reports");

  const session = request.cookies.get("naysin_session")?.value;

  if (isProtectedPath && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  if (path === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ingredients/:path*",
    "/stock/:path*",
    "/menus/:path*",
    "/reports/:path*",
    "/login",
  ],
};

