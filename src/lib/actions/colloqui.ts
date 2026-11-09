"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";

import type { ResultSetHeader } from "mysql2";

import pool from "@/src/lib/db";

import { SESSION_COOKIE, verifySessionToken } from "@/src/lib/auth";

/**
 * Risultato comune delle operazioni sui colloqui.
 */
export type ColloquioActionResult =
   | {
        success: true;
        colloquioId: number;
     }
   | {
        success: false;
        error: string;
     };

/**
 * Verifica che la sessione sia valida.
 */
async function isAuthenticated(): Promise<boolean> {
   const cookieStore = await cookies();
   const token = cookieStore.get(SESSION_COOKIE)?.value;

   return verifySessionToken(token);
}

/**
 * Valida un identificativo INT UNSIGNED di MariaDB.
 */
function isValidId(value: number): boolean {
   return Number.isSafeInteger(value) && value > 0 && value <= 4294967295;
}

/**
 * Verifica una data nel formato YYYY-MM-DD.
 */
function isValidDate(value: string): boolean {
   if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
   }

   const [year, month, day] = value.split("-").map(Number);

   if (year < 1000 || year > 9999) {
      return false;
   }

   const date = new Date(Date.UTC(year, month - 1, day));

   return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

/**
 * Valida la data e il resoconto di un colloquio.
 */
function validateColloquio(dataColloquio: unknown, contenuto: unknown): string | null {
   if (typeof dataColloquio !== "string" || !isValidDate(dataColloquio)) {
      return "Data del colloquio non valida.";
   }

   if (typeof contenuto !== "string" || !contenuto.trim()) {
      return "Il resoconto del colloquio non può essere vuoto.";
   }

   if (Buffer.byteLength(contenuto.trim(), "utf8") > 65535) {
      return "Il resoconto supera la lunghezza consentita.";
   }

   return null;
}

/**
 * Crea un nuovo colloquio descrittivo.
 *
 * Non modifica la tabella attivita_servizio.
 */
export async function creaColloquio(
   detenutoId: number,
   dataColloquio: string,
   contenuto: string,
): Promise<ColloquioActionResult> {
   try {
      if (!(await isAuthenticated())) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      if (!isValidId(detenutoId)) {
         return {
            success: false,
            error: "Identificativo detenuto non valido.",
         };
      }

      const validationError = validateColloquio(dataColloquio, contenuto);

      if (validationError) {
         return {
            success: false,
            error: validationError,
         };
      }

      // Verifica che il detenuto esista.
      const [detenuti] = await pool.execute<import("mysql2").RowDataPacket[]>(
         "SELECT id FROM detenuti WHERE id = ? LIMIT 1",
         [detenutoId],
      );

      if (detenuti.length === 0) {
         return {
            success: false,
            error: "Detenuto non trovato.",
         };
      }

      const [result] = await pool.execute<ResultSetHeader>(
         `
            INSERT INTO colloqui_detenuti
               (detenuto_id, data_colloquio, contenuto)
            VALUES (?, ?, ?)
         `,
         [detenutoId, dataColloquio, contenuto.trim()],
      );

      refresh();

      return {
         success: true,
         colloquioId: result.insertId,
      };
   } catch (error) {
      console.error("Errore creazione colloquio:", error);

      return {
         success: false,
         error: "Errore interno durante la creazione del colloquio.",
      };
   }
}

/**
 * Modifica un colloquio esistente.
 *
 * Il controllo su detenuto_id impedisce di modificare
 * un colloquio appartenente a un altro detenuto.
 */
export async function modificaColloquio(
   detenutoId: number,
   colloquioId: number,
   dataColloquio: string,
   contenuto: string,
): Promise<ColloquioActionResult> {
   try {
      if (!(await isAuthenticated())) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      if (!isValidId(detenutoId) || !isValidId(colloquioId)) {
         return {
            success: false,
            error: "Identificativi non validi.",
         };
      }

      const validationError = validateColloquio(dataColloquio, contenuto);

      if (validationError) {
         return {
            success: false,
            error: validationError,
         };
      }

      const [result] = await pool.execute<ResultSetHeader>(
         `
            UPDATE colloqui_detenuti
            SET
               data_colloquio = ?,
               contenuto = ?
            WHERE id = ?
              AND detenuto_id = ?
         `,
         [dataColloquio, contenuto.trim(), colloquioId, detenutoId],
      );

      if (result.affectedRows === 0) {
         return {
            success: false,
            error: "Colloquio non trovato.",
         };
      }

      refresh();

      return {
         success: true,
         colloquioId,
      };
   } catch (error) {
      console.error("Errore modifica colloquio:", error);

      return {
         success: false,
         error: "Errore interno durante la modifica del colloquio.",
      };
   }
}

/**
 * Elimina definitivamente un colloquio.
 *
 * L'interfaccia deve richiedere una conferma
 * esplicita prima di invocare questa funzione.
 */
export async function eliminaColloquio(detenutoId: number, colloquioId: number): Promise<ColloquioActionResult> {
   try {
      if (!(await isAuthenticated())) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      if (!isValidId(detenutoId) || !isValidId(colloquioId)) {
         return {
            success: false,
            error: "Identificativi non validi.",
         };
      }

      const [result] = await pool.execute<ResultSetHeader>(
         `
            DELETE FROM colloqui_detenuti
            WHERE id = ?
              AND detenuto_id = ?
         `,
         [colloquioId, detenutoId],
      );

      if (result.affectedRows === 0) {
         return {
            success: false,
            error: "Colloquio non trovato.",
         };
      }

      refresh();

      return {
         success: true,
         colloquioId,
      };
   } catch (error) {
      console.error("Errore eliminazione colloquio:", error);

      return {
         success: false,
         error: "Errore interno durante l'eliminazione del colloquio.",
      };
   }
}
