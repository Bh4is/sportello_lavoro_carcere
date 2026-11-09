"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";

import type { ResultSetHeader } from "mysql2";

import pool from "@/src/lib/db";

import { SESSION_COOKIE, verifySessionToken } from "@/src/lib/auth";

/**
 * Campi anagrafici che l'operatrice può modificare.
 */
const editableFields = ["nome", "cognome", "data_nascita", "data_primo_colloquio", "note"] as const;

type EditableField = (typeof editableFields)[number];

/**
 * Risultato serializzabile della Server Action.
 */
export type UpdateDetenutoResult =
   | {
        success: true;
        value: string | null;
     }
   | {
        success: false;
        error: string;
     };

/**
 * Controlla se il campo è modificabile.
 */
function isEditableField(value: string): value is EditableField {
   return editableFields.some((field) => field === value);
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
 * Valida e normalizza il valore da salvare.
 */
function validateValue(field: EditableField, value: string | null): string | null {
   if (value === null || value === "") {
      return null;
   }

   if (field === "nome" || field === "cognome") {
      const normalized = value.trim();

      if (normalized.length > 100) {
         throw new Error("Nome e cognome non possono superare 100 caratteri.");
      }

      return normalized || null;
   }

   if (field === "data_nascita" || field === "data_primo_colloquio") {
      if (!isValidDate(value)) {
         throw new Error("La data inserita non è valida.");
      }

      return value;
   }

   if (field === "note") {
      if (Buffer.byteLength(value, "utf8") > 65535) {
         throw new Error("Le note superano la lunghezza consentita.");
      }

      return value;
   }

   return value;
}

/**
 * Aggiorna un singolo campo anagrafico.
 *
 * La funzione viene eseguita esclusivamente
 * sul server tramite una Server Action.
 */
export async function aggiornaCampoDetenuto(
   detenutoId: number,
   field: string,
   value: string | null,
): Promise<UpdateDetenutoResult> {
   try {
      // Verifica della sessione.
      const cookieStore = await cookies();

      const token = cookieStore.get(SESSION_COOKIE)?.value;

      if (!verifySessionToken(token)) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      // Validazione dell'identificativo.
      if (!Number.isSafeInteger(detenutoId) || detenutoId <= 0 || detenutoId > 4294967295) {
         return {
            success: false,
            error: "Identificativo detenuto non valido.",
         };
      }

      // Whitelist delle colonne modificabili.
      if (!isEditableField(field)) {
         return {
            success: false,
            error: "Campo non modificabile.",
         };
      }

      // Controllo del tipo di valore.
      if (value !== null && typeof value !== "string") {
         return {
            success: false,
            error: "Valore non valido.",
         };
      }

      // Validazione e normalizzazione.
      let normalizedValue: string | null;

      try {
         normalizedValue = validateValue(field, value);
      } catch (error) {
         return {
            success: false,
            error: error instanceof Error ? error.message : "Valore non valido.",
         };
      }

      // Aggiornamento parametrizzato di MariaDB.
      // Il nome della colonna proviene dalla whitelist.
      const [result] = await pool.execute<ResultSetHeader>(
         `
            UPDATE detenuti
            SET \`${field}\` = ?
            WHERE id = ?
         `,
         [normalizedValue, detenutoId],
      );

      if (result.affectedRows === 0) {
         return {
            success: false,
            error: "Detenuto non trovato.",
         };
      }

      // Aggiorna i Server Components dopo la modifica.
      refresh();

      return {
         success: true,
         value: normalizedValue,
      };
   } catch (error) {
      console.error("Errore aggiornamento dati detenuto:", error);

      return {
         success: false,
         error: "Errore interno durante il salvataggio.",
      };
   }
}
