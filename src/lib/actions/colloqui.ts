"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";

import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

import pool from "@/src/lib/db";

import { SESSION_COOKIE, verifySessionToken } from "@/src/lib/auth";

/**
 * Risultato delle operazioni sui colloqui.
 */
export type ColloquioActionResult = { success: true; colloquioId: number } | { success: false; error: string };

/**
 * Dati di rendicontazione associati a un colloquio.
 *
 * Le durate sono sempre espresse in minuti.
 */
export type RendicontazioneColloquio = {
   codiceServizio: string | null;
   minutiColloquio: number;
   minutiBackOffice: number;
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
 * Valida un ID INT UNSIGNED.
 */
function isValidId(value: number): boolean {
   return Number.isSafeInteger(value) && value > 0 && value <= 4294967295;
}

/**
 * Valida una data nel formato YYYY-MM-DD.
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
 * Valida data e resoconto.
 */
function validateColloquio(dataColloquio: unknown, contenuto: unknown): string | null {
   if (typeof dataColloquio !== "string" || !isValidDate(dataColloquio)) {
      return "Data del colloquio non valida.";
   }

   if (typeof contenuto !== "string" || !contenuto.trim()) {
      return "Il resoconto del colloquio è obbligatorio.";
   }

   if (Buffer.byteLength(contenuto.trim(), "utf8") > 65535) {
      return "Il resoconto del colloquio è troppo lungo.";
   }

   return null;
}

/**
 * Valida tipologia e durate.
 *
 * Il codice servizio può essere null soltanto
 * quando entrambe le durate sono zero.
 */
function validateRendicontazione(dati: RendicontazioneColloquio): string | null {
   if (!dati || typeof dati !== "object") {
      return "Dati di rendicontazione non validi.";
   }

   const { codiceServizio, minutiColloquio, minutiBackOffice } = dati;

   if (
      codiceServizio !== null &&
      (typeof codiceServizio !== "string" || !codiceServizio.trim() || codiceServizio.length > 10)
   ) {
      return "Tipologia di colloquio non valida.";
   }

   for (const minuti of [minutiColloquio, minutiBackOffice]) {
      if (!Number.isSafeInteger(minuti) || minuti < 0 || minuti > 4294967295) {
         return "La durata deve essere un numero intero di minuti non negativo.";
      }
   }

   if (codiceServizio === null && (minutiColloquio > 0 || minutiBackOffice > 0)) {
      return "Seleziona una tipologia per registrare le ore.";
   }

   return null;
}

/**
 * Verifica che il codice di servizio esista.
 *
 * Deve essere richiamata nella stessa transazione
 * utilizzata per il salvataggio.
 */
async function codiceServizioEsiste(connection: PoolConnection, codiceServizio: string): Promise<boolean> {
   const [rows] = await connection.execute<RowDataPacket[]>(
      `
         SELECT codice
         FROM codici_servizio
         WHERE codice = ?
         LIMIT 1
      `,
      [codiceServizio],
   );

   return rows.length > 0;
}

/**
 * Inserisce, aggiorna o rimuove le attività
 * rendicontate per il colloquio.
 *
 * La chiave UNIQUE (colloquio_id, tipo_attivita)
 * impedisce di duplicare le due attività.
 *
 * Deve essere richiamata all'interno
 * di una transazione MariaDB.
 */
async function salvaAttivitaColloquio(
   connection: PoolConnection,
   detenutoId: number,
   colloquioId: number,
   dataColloquio: string,
   dati: RendicontazioneColloquio,
): Promise<void> {
   const attivita = [
      {
         tipo: "colloquio",
         minuti: dati.minutiColloquio,
      },
      {
         tipo: "back_office",
         minuti: dati.minutiBackOffice,
      },
   ] as const;

   for (const { tipo, minuti } of attivita) {
      if (minuti === 0) {
         // Zero minuti: nessuna attività da rendicontare.
         await connection.execute(
            `
               DELETE FROM attivita_servizio
               WHERE colloquio_id = ?
                 AND tipo_attivita = ?
            `,
            [colloquioId, tipo],
         );

         continue;
      }

      await connection.execute(
         `
            INSERT INTO attivita_servizio (
               detenuto_id,
               colloquio_id,
               codice_servizio,
               tipo_attivita,
               data_attivita,
               durata_minuti
            )
            VALUES (?, ?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE
               codice_servizio = VALUES(codice_servizio),
               data_attivita = VALUES(data_attivita),
               durata_minuti = VALUES(durata_minuti)
         `,
         [detenutoId, colloquioId, dati.codiceServizio, tipo, dataColloquio, minuti],
      );
   }
}

/**
 * Crea un nuovo colloquio.
 *
 * Il parametro rendicontazione è temporaneamente
 * facoltativo per mantenere compatibile
 * il modulo React esistente.
 */
export async function creaColloquio(
   detenutoId: number,
   dataColloquio: string,
   contenuto: string,
   rendicontazione?: RendicontazioneColloquio,
): Promise<ColloquioActionResult> {
   if (!(await isAuthenticated())) {
      return {
         success: false,
         error: "Sessione scaduta. Effettua nuovamente il login.",
      };
   }

   if (!isValidId(detenutoId)) {
      return {
         success: false,
         error: "Identificativo del detenuto non valido.",
      };
   }

   const errore = validateColloquio(dataColloquio, contenuto);

   if (errore) {
      return { success: false, error: errore };
   }

   if (rendicontazione) {
      const erroreOre = validateRendicontazione(rendicontazione);

      if (erroreOre) {
         return { success: false, error: erroreOre };
      }
   }

   let connection: PoolConnection | undefined;

   try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      if (
         rendicontazione?.codiceServizio &&
         !(await codiceServizioEsiste(connection, rendicontazione.codiceServizio))
      ) {
         await connection.rollback();

         return {
            success: false,
            error: "La tipologia di servizio selezionata non esiste.",
         };
      }

      const [result] = await connection.execute<ResultSetHeader>(
         `
            INSERT INTO colloqui_detenuti (
               detenuto_id,
               data_colloquio,
               codice_servizio,
               contenuto
            )
            VALUES (?, ?, ?, ?)
         `,
         [detenutoId, dataColloquio, rendicontazione?.codiceServizio ?? null, contenuto.trim()],
      );

      if (rendicontazione) {
         await salvaAttivitaColloquio(connection, detenutoId, result.insertId, dataColloquio, rendicontazione);
      }

      await connection.commit();

      refresh();

      return {
         success: true,
         colloquioId: result.insertId,
      };
   } catch (error) {
      if (connection) {
         await connection.rollback().catch(console.error);
      }

      console.error("Errore creazione colloquio:", error);

      return {
         success: false,
         error: "Errore durante il salvataggio del colloquio.",
      };
   } finally {
      connection?.release();
   }
}

/**
 * Modifica un colloquio esistente.
 *
 * Se la rendicontazione non viene fornita,
 * le eventuali attività associate restano
 * inalterate, per compatibilità con la UI attuale.
 */
export async function modificaColloquio(
   detenutoId: number,
   colloquioId: number,
   dataColloquio: string,
   contenuto: string,
   rendicontazione?: RendicontazioneColloquio,
): Promise<ColloquioActionResult> {
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

   const errore = validateColloquio(dataColloquio, contenuto);

   if (errore) {
      return { success: false, error: errore };
   }

   if (rendicontazione) {
      const erroreOre = validateRendicontazione(rendicontazione);

      if (erroreOre) {
         return { success: false, error: erroreOre };
      }
   }

   let connection: PoolConnection | undefined;

   try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Blocca il colloquio durante la modifica.
      const [rows] = await connection.execute<RowDataPacket[]>(
         `
            SELECT id
            FROM colloqui_detenuti
            WHERE id = ?
              AND detenuto_id = ?
            FOR UPDATE
         `,
         [colloquioId, detenutoId],
      );

      if (rows.length === 0) {
         await connection.rollback();

         return {
            success: false,
            error: "Colloquio non trovato.",
         };
      }

      if (
         rendicontazione?.codiceServizio &&
         !(await codiceServizioEsiste(connection, rendicontazione.codiceServizio))
      ) {
         await connection.rollback();

         return {
            success: false,
            error: "La tipologia di servizio selezionata non esiste.",
         };
      }

      if (rendicontazione) {
         await connection.execute(
            `
               UPDATE colloqui_detenuti
               SET
                  data_colloquio = ?,
                  codice_servizio = ?,
                  contenuto = ?
               WHERE id = ?
                 AND detenuto_id = ?
            `,
            [dataColloquio, rendicontazione.codiceServizio, contenuto.trim(), colloquioId, detenutoId],
         );

         await salvaAttivitaColloquio(connection, detenutoId, colloquioId, dataColloquio, rendicontazione);
      } else {
         // Compatibilità con il modulo React precedente.
         await connection.execute(
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
      }

      await connection.commit();

      refresh();

      return {
         success: true,
         colloquioId,
      };
   } catch (error) {
      if (connection) {
         await connection.rollback().catch(console.error);
      }

      console.error("Errore modifica colloquio:", error);

      return {
         success: false,
         error: "Errore durante la modifica del colloquio.",
      };
   } finally {
      connection?.release();
   }
}

/**
 * Elimina un colloquio e le sole attività
 * di rendicontazione ad esso associate.
 *
 * Le altre attività del detenuto
 * rimangono inalterate.
 */
export async function eliminaColloquio(detenutoId: number, colloquioId: number): Promise<ColloquioActionResult> {
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

   let connection: PoolConnection | undefined;

   try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [rows] = await connection.execute<RowDataPacket[]>(
         `
            SELECT id
            FROM colloqui_detenuti
            WHERE id = ?
              AND detenuto_id = ?
            FOR UPDATE
         `,
         [colloquioId, detenutoId],
      );

      if (rows.length === 0) {
         await connection.rollback();

         return {
            success: false,
            error: "Colloquio non trovato.",
         };
      }

      // Prima rimuoviamo le attività associate,
      // rispettando il vincolo di chiave esterna.
      await connection.execute(
         `
            DELETE FROM attivita_servizio
            WHERE colloquio_id = ?
              AND detenuto_id = ?
         `,
         [colloquioId, detenutoId],
      );

      await connection.execute(
         `
            DELETE FROM colloqui_detenuti
            WHERE id = ?
              AND detenuto_id = ?
         `,
         [colloquioId, detenutoId],
      );

      await connection.commit();

      refresh();

      return {
         success: true,
         colloquioId,
      };
   } catch (error) {
      if (connection) {
         await connection.rollback().catch(console.error);
      }

      console.error("Errore eliminazione colloquio:", error);

      return {
         success: false,
         error: "Errore durante l'eliminazione del colloquio.",
      };
   } finally {
      connection?.release();
   }
}
