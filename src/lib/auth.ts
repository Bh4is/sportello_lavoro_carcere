import "server-only";

import {
    createHmac,
    randomBytes,
    scryptSync,
    timingSafeEqual,
} from "node:crypto";

export const SESSION_COOKIE = "slc_session";
export const SESSION_DURATION = 30 * 60; // 30 minuti

function getSessionSecret(): string {
    const secret = process.env.SLC_SESSION_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("SLC_SESSION_SECRET mancante o troppo corta");
    }

    return secret;
}

// Genera un hash della password
export function hashPassword(password: string): string {
    const salt = randomBytes(32).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");

    return `${salt}:${hash}`;
}

// Verifica la password senza conservarla in chiaro
export function verifyPassword(password: string): boolean {
    const stored = process.env.SLC_PASSWORD_HASH;

    if (!stored) {
        throw new Error("SLC_PASSWORD_HASH non configurata");
    }

    const parts = stored.split(":");

    if (parts.length !== 2) {
        throw new Error("Formato hash password non valido");
    }

    const [salt, expectedHex] = parts;

    if (!/^[a-f0-9]{64}$/i.test(salt) ||
        !/^[a-f0-9]{128}$/i.test(expectedHex)) {
        throw new Error("Formato hash password non valido");
    }

    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(password, salt, expected.length);

    return timingSafeEqual(actual, expected);
}

// Firma una sessione con HMAC-SHA256
function sign(value: string): string {
    return createHmac("sha256", getSessionSecret())
        .update(value)
        .digest("hex");
}

// Crea un token valido per 30 minuti
export function createSessionToken(): string {
    const expiresAt = Date.now() + SESSION_DURATION * 1000;
    const nonce = randomBytes(16).toString("hex");

    const payload = `${expiresAt}.${nonce}`;

    return `${payload}.${sign(payload)}`;
}

// Verifica integrità e scadenza della sessione
export function verifySessionToken(token?: string): boolean {
    if (!token) return false;

    const parts = token.split(".");

    if (parts.length !== 3) return false;

    const [expiresAtString, nonce, signature] = parts;

    if (!/^\d+$/.test(expiresAtString) ||
        !/^[a-f0-9]{32}$/.test(nonce) ||
        !/^[a-f0-9]{64}$/.test(signature)) {
        return false;
    }

    const expiresAt = Number(expiresAtString);

    if (!Number.isSafeInteger(expiresAt) ||
        expiresAt <= Date.now()) {
        return false;
    }

    const payload = `${expiresAtString}.${nonce}`;

    const expected = Buffer.from(sign(payload), "hex");
    const actual = Buffer.from(signature, "hex");

    return timingSafeEqual(actual, expected);
}