import "server-only";

import type { RowDataPacket } from "mysql2";

import pool from "@/src/lib/db";

/**
 * Codice di servizio selezionabile
 * durante la registrazione di un colloquio.
 */
export type CodiceServizioColloquio = {
   codice: string;
   nome: string;
};

/**
 * Colloquio registrato nella scheda individuale.
 *
 * Le durate sono espresse in minuti,
 * coerentemente con attivita_servizio.
 */
export type ColloquioDetenuto = {
   id: number;
   detenuto_id: number;
   data_colloquio: string;
   codice_servizio: string | null;
   nome_servizio: string | null;
   contenuto: string;
   minuti_colloquio: number;
   minuti_back_office: number;
   created_at: string;
   updated_at: string;
};

/**
 * Recupera i codici di servizio disponibili.
 *
 * Sono utilizzati per il menu a tendina
 * del modulo di inserimento e modifica.
 */
export async function getCodiciServizioColloqui(): Promise<CodiceServizioColloquio[]> {
   const [rows] = await pool.execute<(RowDataPacket & CodiceServizioColloquio)[]>(`
      SELECT
         codice,
         nome
      FROM codici_servizio
      ORDER BY codice ASC
   `);

   return rows.map((row) => ({
      codice: row.codice,
      nome: row.nome,
   }));
}

/**
 * Recupera i colloqui del detenuto,
 * comprendendo tipologia e ore rendicontate.
 *
 * Le ore vengono lette esclusivamente
 * dalle attività associate tramite colloquio_id.
 *
 * Le eventuali attività storiche non associate
 * rimangono inalterate.
 */
export async function getColloquiDetenuto(detenutoId: number): Promise<ColloquioDetenuto[]> {
   if (!Number.isSafeInteger(detenutoId) || detenutoId <= 0 || detenutoId > 4294967295) {
      return [];
   }

   const [rows] = await pool.execute<(RowDataPacket & ColloquioDetenuto)[]>(
      `
      SELECT
         c.id,
         c.detenuto_id,

         DATE_FORMAT(
            c.data_colloquio,
            '%Y-%m-%d'
         ) AS data_colloquio,

         c.codice_servizio,
         s.nome AS nome_servizio,
         c.contenuto,

         COALESCE(
            SUM(
               CASE
                  WHEN a.tipo_attivita = 'colloquio'
                  THEN a.durata_minuti
                  ELSE 0
               END
            ),
            0
         ) AS minuti_colloquio,

         COALESCE(
            SUM(
               CASE
                  WHEN a.tipo_attivita = 'back_office'
                  THEN a.durata_minuti
                  ELSE 0
               END
            ),
            0
         ) AS minuti_back_office,

         DATE_FORMAT(
            c.created_at,
            '%Y-%m-%d %H:%i:%s'
         ) AS created_at,

         DATE_FORMAT(
            c.updated_at,
            '%Y-%m-%d %H:%i:%s'
         ) AS updated_at

      FROM colloqui_detenuti AS c

      LEFT JOIN codici_servizio AS s
         ON s.codice = c.codice_servizio

      LEFT JOIN attivita_servizio AS a
         ON a.colloquio_id = c.id
         AND a.detenuto_id = c.detenuto_id

      WHERE c.detenuto_id = ?

      GROUP BY
         c.id,
         c.detenuto_id,
         c.data_colloquio,
         c.codice_servizio,
         s.nome,
         c.contenuto,
         c.created_at,
         c.updated_at

      ORDER BY
         c.data_colloquio DESC,
         c.created_at DESC,
         c.id DESC
   `,
      [detenutoId],
   );

   return rows.map((row) => ({
      id: row.id,
      detenuto_id: row.detenuto_id,
      data_colloquio: row.data_colloquio,
      codice_servizio: row.codice_servizio,
      nome_servizio: row.nome_servizio,
      contenuto: row.contenuto,
      minuti_colloquio: Number(row.minuti_colloquio),
      minuti_back_office: Number(row.minuti_back_office),
      created_at: row.created_at,
      updated_at: row.updated_at,
   }));
}
