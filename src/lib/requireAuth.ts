
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
    SESSION_COOKIE,
    verifySessionToken,
} from "@/src/lib/auth";

export async function requireAuth(): Promise<void> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!verifySessionToken(token)) {
        redirect("/login");
    }
}
