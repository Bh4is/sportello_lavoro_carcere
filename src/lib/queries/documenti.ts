import "server-only";

import type { RowDataPacket } from "mysql2";

import pool from "@/src/lib/db";

/**
 * Stati disponibili per ciascun documento.
 *
 * null indica che non è ancora stato
 * assegnato alcuno stato.
 */
export type StatoDocumento = "si" | "no" | "in_corso" | null;

/**
 * Tipologia di documento presente nel catalogo.
 */
export type TipologiaDocumento = {
   id: number;
   nome: string;
   descrizione: string | null;
   attivo: boolean;
};

/**
 * Documento con lo stato relativo
 * al detenuto selezionato.
 */
export type DocumentoDetenuto = {
   id: number;
   nome: string;
   descrizione: string | null;
   stato: StatoDocumento;
};

/**
 * Recupera le tipologie di documenti attive,
 * ordinate alfabeticamente.
 */
export async function getTipologieDocumenti(): Promise<TipologiaDocumento[]> {
   const [rows] = await pool.execute<
      (RowDataPacket & {
         id: number;
         nome: string;
         descrizione: string | null;
         attivo: number;
      })[]
   >(`
      SELECT
         id,
         nome,
         descrizione,
         attivo
      FROM tipologie_documenti
      WHERE attivo = 1
      ORDER BY nome ASC, id ASC
   `);

   return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      descrizione: row.descrizione,
      attivo: Boolean(row.attivo),
   }));
}

/**
 * Recupera la checklist documentale
 * di un singolo detenuto.
 *
 * Include tutti i documenti attivi,
 * anche quelli non ancora valutati.
 */
export async function getDocumentiDetenuto(detenutoId: number): Promise<DocumentoDetenuto[]> {
   if (!Number.isSafeInteger(detenutoId) || detenutoId <= 0 || detenutoId > 4294967295) {
      return [];
   }

   const [rows] = await pool.execute<(RowDataPacket & DocumentoDetenuto)[]>(
      `
      SELECT
         td.id,
         td.nome,
         td.descrizione,
         dd.stato
      FROM tipologie_documenti AS td
      LEFT JOIN documenti_detenuti AS dd
         ON dd.documento_id = td.id
         AND dd.detenuto_id = ?
      WHERE td.attivo = 1
      ORDER BY td.nome ASC, td.id ASC
   `,
      [detenutoId],
   );

   return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      descrizione: row.descrizione,
      stato: row.stato,
   }));
}
