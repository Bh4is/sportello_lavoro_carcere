
import "server-only";

import pool from "@/src/lib/db";

import type {
    RiepilogoOreMensili,
    OreMensiliRow,
} from "@/src/types/ore";

/**
 * Recupera il riepilogo mensile delle ore
 * dalla VIEW MariaDB riepilogo_ore_mensili.
 */
export async function getRiepilogoOreMensili(): Promise<OreMensiliRow[]> {
    const [rows] = await pool.query<RiepilogoOreMensili[]>(`
    SELECT
      anno,
      mese,
      minuti_colloquio,
      minuti_back_office,
      minuti_totali
    FROM riepilogo_ore_mensili
    ORDER BY anno DESC, mese DESC
  `);

    // Formattatore per i nomi dei mesi in italiano
    const formatMese = new Intl.DateTimeFormat("it-IT", {
        month: "long",
        timeZone: "UTC",
    });

    return rows.map((row) => {
        const nomeMese = formatMese.format(
            new Date(Date.UTC(row.anno, row.mese - 1, 1))
        );

        return {
            id: `${row.anno}-${String(row.mese).padStart(2, "0")}`,
            anno: Number(row.anno),
            mese: Number(row.mese),
            nomeMese:
                nomeMese.charAt(0).toUpperCase() + nomeMese.slice(1),
            minutiColloquio: Number(row.minuti_colloquio),
            minutiBackOffice: Number(row.minuti_back_office),
            minutiTotali: Number(row.minuti_totali),
        };
    });
}
