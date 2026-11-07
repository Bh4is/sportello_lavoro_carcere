import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
    // Accetta soltanto richieste provenienti dalla stessa applicazione.
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
        return new NextResponse("Richiesta non autorizzata", {
            status: 403,
        });
    }

    const response = NextResponse.redirect(
        new URL("/login", request.url),
        303
    );

    // Elimina il cookie di autenticazione.
    response.cookies.set({
        name: SESSION_COOKIE,
        value: "",
        httpOnly: true,
        secure: process.env.SLC_COOKIE_SECURE === "true",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
}