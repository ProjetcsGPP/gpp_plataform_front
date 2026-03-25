import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/portal/login",
  "/acoes-pngi/login",
  "/carga-org-lot/login",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const hasSession = request.cookies.has("gpp_session");

  if (!isPublic && !hasSession) {
    const loginUrl = new URL("/portal/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|_next/static|_next/image).*)"],
};
