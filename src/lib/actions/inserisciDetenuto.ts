"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import type { ResultSetHeader } from "mysql2";

import pool from "@/src/lib/db";

import { SESSION_COOKIE, verifySessionToken } from "@/src/lib/auth";

export type InserisciDetenutoResult =
   | {
        success: true;
        detenutoId: number;
     }
   | {
        success: false;
        error: string;
     };

export type NuovoDetenuto = {
   nome: string;
   cognome: string;
   dataNascita: string | null;
   dataPrimoColloquio: string | null;
   note: string | null;
};

/**
 * Verifica la sessione dell'operatrice.
 */
async function isAuthenticated(): Promise<boolean> {
   const cookieStore = await cookies();
   const token = cookieStore.get(SESSION_COOKIE)?.value;

   return verifySessionToken(token);
}

/**
 * Controlla che una data rispetti il formato
 * YYYY-MM-DD e rappresenti un giorno reale.
 */
function isValidDate(value: string): boolean {
   if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
   }

   const [year, month, day] = value.split("-").map(Number);

   const date = new Date(Date.UTC(year, month - 1, day));

   return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

/**
 * Normalizza i campi facoltativi.
 */
function normalizeOptional(value: string | null): string | null {
   const normalized = value?.trim() ?? "";

   return normalized || null;
}

/**
 * Inserisce una nuova anagrafica nella tabella detenuti.
 *
 * La Server Action è richiamabile dal client,
 * quindi autenticazione e validazione avvengono
 * sempre sul server.
 */
export async function inserisciDetenuto(dati: NuovoDetenuto): Promise<InserisciDetenutoResult> {
   try {
      if (!(await isAuthenticated())) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      if (
         !dati ||
         typeof dati !== "object" ||
         typeof dati.nome !== "string" ||
         typeof dati.cognome !== "string" ||
         !(dati.dataNascita === null || typeof dati.dataNascita === "string") ||
         !(dati.dataPrimoColloquio === null || typeof dati.dataPrimoColloquio === "string") ||
         !(dati.note === null || typeof dati.note === "string")
      ) {
         return {
            success: false,
            error: "Dati anagrafici non validi.",
         };
      }

      const nome = dati.nome.trim();
      const cognome = dati.cognome.trim();

      const dataNascita = normalizeOptional(dati.dataNascita);

      const dataPrimoColloquio = normalizeOptional(dati.dataPrimoColloquio);

      const note = normalizeOptional(dati.note);

      // Nome e cognome obbligatori.
      if (!nome || !cognome) {
         return {
            success: false,
            error: "Nome e cognome sono obbligatori.",
         };
      }

      // Coerente con VARCHAR(100) in MariaDB.
      if ([...nome].length > 100 || [...cognome].length > 100) {
         return {
            success: false,
            error: "Nome e cognome non possono superare 100 caratteri.",
         };
      }

      // Validazione delle date facoltative.
      if (dataNascita && !isValidDate(dataNascita)) {
         return {
            success: false,
            error: "Data di nascita non valida.",
         };
      }

      if (dataPrimoColloquio && !isValidDate(dataPrimoColloquio)) {
         return {
            success: false,
            error: "Data del primo colloquio non valida.",
         };
      }

      // La colonna note è di tipo TEXT.
      if (note && Buffer.byteLength(note, "utf8") > 65535) {
         return {
            success: false,
            error: "Le note inserite sono troppo lunghe.",
         };
      }

      const [result] = await pool.execute<ResultSetHeader>(
         `
            INSERT INTO detenuti (
               nome,
               cognome,
               data_nascita,
               data_primo_colloquio,
               note
            )
            VALUES (?, ?, ?, ?, ?)
         `,
         [nome, cognome, dataNascita, dataPrimoColloquio, note],
      );

      // Aggiorna i dati della homepage.
      revalidatePath("/");

      return {
         success: true,
         detenutoId: result.insertId,
      };
   } catch (error) {
      console.error("Errore inserimento anagrafica:", error);

      return {
         success: false,
         error: "Errore durante l'inserimento dell'anagrafica.",
      };
   }
}
