import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/portal/login",
  "/acoes-pngi/login",
  "/carga-org-lot/login",
];
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ ignora arquivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const hasSession = request.cookies.has("gpp_session");

  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/portal/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
