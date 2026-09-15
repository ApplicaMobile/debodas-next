import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import {
  detectLocaleFromHeader,
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  parseLocale,
} from "@/i18n/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response: NextResponse;
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      response = NextResponse.redirect(loginUrl);
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    const locale = parseLocale(
      detectLocaleFromHeader(request.headers.get("accept-language")),
    );
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: LOCALE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|uploads/|.*\\..*).*)",
  ],
};
