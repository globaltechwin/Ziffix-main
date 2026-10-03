import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up"];

function isPublicRoute(pathname: string) {
  return publicRoutes.includes(pathname);
}

function getRoleFromSession(session: string): string | null {
  try {
    const decoded = JSON.parse(atob(session));
    return decoded.role || null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const pathname = request.nextUrl.pathname;

  // API routes must pass through untouched.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public pages do not require authentication.
  if (isPublicRoute(pathname)) {
    if (session && (pathname === "/sign-in" || pathname === "/sign-up")) {
      const role = getRoleFromSession(session);

      if (role === "admin") {
        return NextResponse.redirect(
          new URL("/admin/dashboard", request.url),
        );
      }

      if (role === "technician") {
        return NextResponse.redirect(
          new URL("/technician/dashboard", request.url),
        );
      }

      return NextResponse.redirect(
        new URL("/customer/home", request.url),
      );
    }

    return NextResponse.next();
  }

  // Logged-in users.
  if (session) {
    const role = getRoleFromSession(session);

    const portalMatch = pathname.match(/^\/(admin|customer|technician)/);

    if (portalMatch) {
      const portal = portalMatch[1];

      if (portal === "admin" && role !== "admin") {
        return NextResponse.redirect(
          new URL("/sign-in", request.url),
        );
      }

      if (
        portal === "technician" &&
        role !== "technician" &&
        role !== "admin"
      ) {
        return NextResponse.redirect(
          new URL("/sign-in", request.url),
        );
      }
    }

    return NextResponse.next();
  }

  // Unauthenticated protected page.
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.searchParams.set("from", pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|api|.*\\.).*)",
  ],
};
