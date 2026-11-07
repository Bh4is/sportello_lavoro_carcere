
import { NextRequest, NextResponse } from "next/server";

import {
    createSessionToken,
    SESSION_COOKIE,
    SESSION_DURATION,
    verifyPassword,
} from "@/src/lib/auth";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

let failedAttempts = 0;
let lockedUntil = 0;

function redirectLogin(request: NextRequest, error: string) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", error);

    const response = NextResponse.redirect(url, 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
        return new NextResponse("Richiesta non autorizzata", {
            status: 403,
        });
    }

    // Verifica se il blocco temporaneo è ancora attivo.
    const now = Date.now();

    if (lockedUntil > now) {
        return redirectLogin(request, "locked");
    }

    // Il periodo di blocco è terminato.
    if (lockedUntil !== 0) {
        lockedUntil = 0;
        failedAttempts = 0;
    }

    try {
        const formData = await request.formData();
        const password = formData.get("password");

        if (
            typeof password !== "string" ||
            password.length === 0 ||
            password.length > 1024
        ) {
            return redirectLogin(request, "1");
        }

        const valid = verifyPassword(password);

        if (!valid) {
            failedAttempts++;

            if (failedAttempts >= MAX_ATTEMPTS) {
                lockedUntil = Date.now() + LOCK_DURATION_MS;
                return redirectLogin(request, "locked");
            }

            return redirectLogin(request, "1");
        }

        // Login corretto: azzera i tentativi falliti.
        failedAttempts = 0;
        lockedUntil = 0;

        const token = createSessionToken();

        const response = NextResponse.redirect(
            new URL("/", request.url),
            303
        );

        response.cookies.set({
            name: SESSION_COOKIE,
            value: token,
            httpOnly: true,
            secure: process.env.SLC_COOKIE_SECURE === "true",
            sameSite: "strict",
            path: "/",
            maxAge: SESSION_DURATION,
        });

        response.headers.set("Cache-Control", "no-store");

        return response;
    } catch (error) {
        console.error("Errore durante il login:", error);

        return new NextResponse("Errore interno di autenticazione", {
            status: 500,
        });
    }
}
