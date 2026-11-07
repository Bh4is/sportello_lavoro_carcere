import type { RowDataPacket } from "mysql2";

// Dati restituiti dalla VIEW riepilogo_ore_mensili
export interface RiepilogoOreMensili extends RowDataPacket {
    anno: number;
    mese: number;
    minuti_colloquio: number;
    minuti_back_office: number;
    minuti_totali: number;
}

// Struttura di una riga della tabella Ore
export type OreMensiliRow = {
    id: string;
    anno: number;
    mese: number;
    nomeMese: string;
    minutiColloquio: number;
    minutiBackOffice: number;
    minutiTotali: number;
};
