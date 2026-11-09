import "server-only";

import type { RowDataPacket } from "mysql2";

import pool from "@/src/lib/db";

/**
 * Rappresenta un colloquio registrato nella
 * scheda individuale di un detenuto.
 */
export type ColloquioDetenuto = {
   id: number;
   detenuto_id: number;
   data_colloquio: string;
   contenuto: string;
   created_at: string;
   updated_at: string;
};

/**
 * Recupera tutti i colloqui di un detenuto,
 * ordinati dal più recente al meno recente.
 */
export async function getColloquiDetenuto(detenutoId: number): Promise<ColloquioDetenuto[]> {
   if (!Number.isSafeInteger(detenutoId) || detenutoId <= 0) {
      return [];
   }

   const [rows] = await pool.execute<(RowDataPacket & ColloquioDetenuto)[]>(
      `
      SELECT
         id,
         detenuto_id,
         DATE_FORMAT(
            data_colloquio,
            '%Y-%m-%d'
         ) AS data_colloquio,
         contenuto,
         DATE_FORMAT(
            created_at,
            '%Y-%m-%d %H:%i:%s'
         ) AS created_at,
         DATE_FORMAT(
            updated_at,
            '%Y-%m-%d %H:%i:%s'
         ) AS updated_at
      FROM colloqui_detenuti
      WHERE detenuto_id = ?
      ORDER BY
         data_colloquio DESC,
         created_at DESC,
         id DESC
   `,
      [detenutoId],
   );

   return rows.map((row) => ({
      id: row.id,
      detenuto_id: row.detenuto_id,
      data_colloquio: row.data_colloquio,
      contenuto: row.contenuto,
      created_at: row.created_at,
      updated_at: row.updated_at,
   }));
}
