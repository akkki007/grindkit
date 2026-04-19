import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/appwrite/config";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const isAppRoute = pathname.startsWith("/app");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAppRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)"],
};

export { PUBLIC_PATHS };
