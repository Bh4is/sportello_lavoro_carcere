import "server-only";

import type { RowDataPacket } from "mysql2";

import pool from "@/src/lib/db";

/**
 * Rappresenta un detenuto nell'elenco di ricerca.
 */
export type DetenutoSearchItem = {
   id: number;
   nome: string;
   cognome: string;
};

/**
 * Rappresenta i dati anagrafici di un detenuto.
 */
export type Detenuto = {
   id: number;
   nome: string | null;
   cognome: string | null;
   data_nascita: string | null;
   data_primo_colloquio: string | null;
   note: string | null;
};

/**
 * Recupera i detenuti per la barra di ricerca.
 * I risultati sono ordinati alfabeticamente.
 */
export async function getDetenutiSearch(): Promise<DetenutoSearchItem[]> {
   const [rows] = await pool.execute<(RowDataPacket & DetenutoSearchItem)[]>(`
      SELECT
         id,
         COALESCE(nome, '') AS nome,
         COALESCE(cognome, '') AS cognome
      FROM detenuti
      ORDER BY cognome ASC, nome ASC, id ASC
   `);

   return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      cognome: row.cognome,
   }));
}

/**
 * Recupera i dati anagrafici di un singolo detenuto.
 *
 * Restituisce null se il detenuto non esiste.
 */
export async function getDetenutoById(id: number): Promise<Detenuto | null> {
   if (!Number.isSafeInteger(id) || id <= 0) {
      return null;
   }

   const [rows] = await pool.execute<(RowDataPacket & Detenuto)[]>(
      `
      SELECT
         id,
         nome,
         cognome,
         DATE_FORMAT(data_nascita, '%Y-%m-%d') AS data_nascita,
         DATE_FORMAT(data_primo_colloquio, '%Y-%m-%d') AS data_primo_colloquio,
         note
      FROM detenuti
      WHERE id = ?
      LIMIT 1
   `,
      [id],
   );

   if (rows.length === 0) {
      return null;
   }

   const row = rows[0];

   return {
      id: row.id,
      nome: row.nome,
      cognome: row.cognome,
      data_nascita: row.data_nascita,
      data_primo_colloquio: row.data_primo_colloquio,
      note: row.note,
   };
}
