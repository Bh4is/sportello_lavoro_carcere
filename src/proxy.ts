
import { NextRequest, NextResponse } from "next/server";

import {
    SESSION_COOKIE,
    verifySessionToken,
} from "@/src/lib/auth";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const authenticated = verifySessionToken(token);

    const isLoginPage = pathname === "/login";
    const isLoginApi = pathname === "/api/auth/login";

    if (isLoginApi) {
        return NextResponse.next();
    }

    if (isLoginPage && authenticated) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (isLoginPage) {
        return NextResponse.next();
    }

    if (!authenticated) {
        const response = NextResponse.redirect(
            new URL("/login", request.url)
        );

        response.cookies.delete(SESSION_COOKIE);
        response.headers.set("Cache-Control", "no-store");

        return response;
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
