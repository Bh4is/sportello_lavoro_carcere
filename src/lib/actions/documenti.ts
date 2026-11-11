"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";

import type { ResultSetHeader, RowDataPacket } from "mysql2";

import pool from "@/src/lib/db";

import { SESSION_COOKIE, verifySessionToken } from "@/src/lib/auth";

import type { StatoDocumento } from "@/src/lib/queries/documenti";

/**
 * Risultato delle operazioni sulla checklist.
 */
export type DocumentoActionResult =
   | {
        success: true;
     }
   | {
        success: false;
        error: string;
     };

/**
 * Risultato della creazione di una tipologia.
 */
export type NuovaTipologiaResult =
   | {
        success: true;
        documentoId: number;
     }
   | {
        success: false;
        error: string;
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
 * Valida un identificativo INT UNSIGNED.
 */
function isValidId(value: number): boolean {
   return Number.isSafeInteger(value) && value > 0 && value <= 4294967295;
}

/**
 * Verifica uno degli stati consentiti.
 */
function isValidStato(value: unknown): value is StatoDocumento {
   return value === null || value === "si" || value === "no" || value === "in_corso";
}

/**
 * Verifica che il detenuto esista
 * e che la tipologia di documento sia attiva.
 *
 * La verifica viene condivisa dalle operazioni
 * di aggiornamento dello stato e delle note.
 */
async function documentoValido(detenutoId: number, documentoId: number): Promise<boolean> {
   const [rows] = await pool.execute<RowDataPacket[]>(
      `
         SELECT
            d.id AS detenuto_id,
            td.id AS documento_id
         FROM detenuti AS d
         CROSS JOIN tipologie_documenti AS td
         WHERE d.id = ?
           AND td.id = ?
           AND td.attivo = 1
         LIMIT 1
      `,
      [detenutoId, documentoId],
   );

   return rows.length > 0;
}

/**
 * Aggiorna lo stato di un documento
 * per il detenuto selezionato.
 *
 * null rappresenta "Non impostato".
 *
 * Importante:
 * la modifica dello stato non deve mai
 * cancellare le note associate al documento.
 */
export async function aggiornaStatoDocumento(
   detenutoId: number,
   documentoId: number,
   stato: StatoDocumento,
): Promise<DocumentoActionResult> {
   try {
      if (!(await isAuthenticated())) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      if (!isValidId(detenutoId) || !isValidId(documentoId)) {
         return {
            success: false,
            error: "Identificativi non validi.",
         };
      }

      if (!isValidStato(stato)) {
         return {
            success: false,
            error: "Stato del documento non valido.",
         };
      }

      if (!(await documentoValido(detenutoId, documentoId))) {
         return {
            success: false,
            error: "Detenuto o documento non trovato.",
         };
      }

      if (stato === null) {
         // Reimposta soltanto lo stato.
         // Non elimina la riga e preserva le note.
         await pool.execute(
            `
               UPDATE documenti_detenuti
               SET stato = NULL
               WHERE detenuto_id = ?
                 AND documento_id = ?
            `,
            [detenutoId, documentoId],
         );
      } else {
         // Crea o aggiorna lo stato del documento.
         // Le eventuali note già presenti rimangono invariate.
         await pool.execute(
            `
               INSERT INTO documenti_detenuti
                  (detenuto_id, documento_id, stato)
               VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE
                  stato = VALUES(stato)
            `,
            [detenutoId, documentoId, stato],
         );
      }

      refresh();

      return {
         success: true,
      };
   } catch (error) {
      console.error("Errore aggiornamento stato documento:", error);

      return {
         success: false,
         error: "Errore durante l'aggiornamento del documento.",
      };
   }
}

/**
 * Aggiorna le note di un documento
 * per uno specifico detenuto.
 *
 * Le note sono indipendenti dallo stato
 * del documento e possono essere salvate
 * anche quando lo stato è "Non impostato".
 *
 * Una stringa vuota cancella le note,
 * senza modificare lo stato esistente.
 */
export async function aggiornaNoteDocumento(
   detenutoId: number,
   documentoId: number,
   note: string,
): Promise<DocumentoActionResult> {
   try {
      if (!(await isAuthenticated())) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      if (!isValidId(detenutoId) || !isValidId(documentoId)) {
         return {
            success: false,
            error: "Identificativi non validi.",
         };
      }

      if (typeof note !== "string") {
         return {
            success: false,
            error: "Le note inserite non sono valide.",
         };
      }

      const noteNormalizzate = note.trim();

      // Il tipo TEXT di MariaDB supporta
      // fino a 65.535 byte.
      if (Buffer.byteLength(noteNormalizzate, "utf8") > 65535) {
         return {
            success: false,
            error: "Le note sono troppo lunghe.",
         };
      }

      if (!(await documentoValido(detenutoId, documentoId))) {
         return {
            success: false,
            error: "Detenuto o documento non trovato.",
         };
      }

      // Crea l'associazione se non esiste.
      // In caso contrario aggiorna solo le note.
      // Lo stato del documento non viene modificato.
      //
      // Una nota vuota viene salvata come NULL.
      await pool.execute(
         `
            INSERT INTO documenti_detenuti
               (detenuto_id, documento_id, stato, note)
            VALUES (?, ?, NULL, ?)
            ON DUPLICATE KEY UPDATE
               note = VALUES(note)
         `,
         [detenutoId, documentoId, noteNormalizzate || null],
      );

      refresh();

      return {
         success: true,
      };
   } catch (error) {
      console.error("Errore aggiornamento note documento:", error);

      return {
         success: false,
         error: "Errore durante il salvataggio delle note.",
      };
   }
}

/**
 * Aggiunge una nuova tipologia di documento
 * al catalogo condiviso.
 *
 * La nuova voce sarà disponibile
 * nelle checklist di tutti i detenuti.
 */
export async function aggiungiTipologiaDocumento(
   nome: string,
   descrizione: string | null = null,
): Promise<NuovaTipologiaResult> {
   try {
      if (!(await isAuthenticated())) {
         return {
            success: false,
            error: "Sessione scaduta. Effettua nuovamente il login.",
         };
      }

      if (typeof nome !== "string") {
         return {
            success: false,
            error: "Nome del documento non valido.",
         };
      }

      if (descrizione !== null && typeof descrizione !== "string") {
         return {
            success: false,
            error: "Descrizione non valida.",
         };
      }

      const nomeNormalizzato = nome.trim();
      const descrizioneNormalizzata = descrizione?.trim() || null;

      if (!nomeNormalizzato) {
         return {
            success: false,
            error: "Inserire il nome del documento.",
         };
      }

      if (nomeNormalizzato.length > 150 || Buffer.byteLength(nomeNormalizzato, "utf8") > 600) {
         return {
            success: false,
            error: "Il nome non può superare 150 caratteri.",
         };
      }

      if (descrizioneNormalizzata && Buffer.byteLength(descrizioneNormalizzata, "utf8") > 65535) {
         return {
            success: false,
            error: "La descrizione è troppo lunga.",
         };
      }

      const [result] = await pool.execute<ResultSetHeader>(
         `
            INSERT INTO tipologie_documenti
               (nome, descrizione, attivo)
            VALUES (?, ?, 1)
         `,
         [nomeNormalizzato, descrizioneNormalizzata],
      );

      refresh();

      return {
         success: true,
         documentoId: result.insertId,
      };
   } catch (error) {
      // Gestione dei nomi duplicati.
      if (error !== null && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
         return {
            success: false,
            error: "Esiste già un documento con questo nome.",
         };
      }

      console.error("Errore creazione tipologia documento:", error);

      return {
         success: false,
         error: "Errore durante la creazione del documento.",
      };
   }
}
