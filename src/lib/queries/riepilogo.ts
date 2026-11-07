
import "server-only";
import { connection } from "next/server";

import pool from "@/src/lib/db";

import type {
    RiepilogoOre,
    CodiceServizio,
    DetenutoRow,
} from "@/src/types/riepilogo";

/**
 * Recupera i dati necessari per la tabella
 * riepilogativa della homepage.
 */
export async function getDatiRiepilogo(): Promise<{
    codici: CodiceServizio[];
    detenuti: DetenutoRow[];
}> {
  await connection();
    // Recupera contemporaneamente codici e riepilogo ore
    const [risultatoCodici, risultatoOre] = await Promise.all([
        // Codici di servizio e relative tipologie
        pool.query<CodiceServizio[]>(`
      SELECT
        s.codice,
        t.nome AS tipologia,
        t.id AS tipologia_id
      FROM codici_servizio s
      JOIN tipologie_servizio t
        ON s.tipologia_id = t.id
      ORDER BY t.id, s.codice
    `),

        // Riepilogo delle ore e data del primo colloquio
        pool.query<RiepilogoOre[]>(`
      SELECT
        detenuto_id,
        detenuto,
        DATE_FORMAT(
          data_primo_colloquio,
          '%d/%m/%Y'
        ) AS data_primo_colloquio,
        codice,
        minuti_colloquio,
        minuti_back_office
      FROM riepilogo_ore
      ORDER BY detenuto, codice
    `),
    ]);

    const codici = risultatoCodici[0];
    const riepilogo = risultatoOre[0];

    // Raggruppa tutte le attività per detenuto
    const detenutiMap = new Map<number, DetenutoRow>();

    for (const record of riepilogo) {
        // Crea una sola riga per ciascun detenuto
        if (!detenutiMap.has(record.detenuto_id)) {
            detenutiMap.set(record.detenuto_id, {
                id: record.detenuto_id,
                detenuto: record.detenuto,
                data_primo_colloquio: record.data_primo_colloquio,
                servizi: {},
            });
        }

        const detenuto = detenutiMap.get(record.detenuto_id)!;

        // Memorizza le ore relative a ciascun codice
        detenuto.servizi[record.codice] = {
            colloquio: Number(record.minuti_colloquio),
            backOffice: Number(record.minuti_back_office),
        };
    }

    // Converte la Map in un array
    const detenuti = Array.from(detenutiMap.values());

    // Ordinamento alfabetico
    detenuti.sort((a, b) =>
        a.detenuto.localeCompare(b.detenuto, "it")
    );

    return {
        codici,
        detenuti,
    };
}
