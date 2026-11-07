import type { RowDataPacket } from "mysql2";

// Dati restituiti dalla VIEW MariaDB riepilogo_ore
export interface RiepilogoOre extends RowDataPacket {
  detenuto_id: number;
  detenuto: string;
  data_primo_colloquio: string | null;
  codice: string;
  minuti_colloquio: number;
  minuti_back_office: number;
}

// Codici di servizio con relativa tipologia
export interface CodiceServizio extends RowDataPacket {
  codice: string;
  tipologia: string;
  tipologia_id: number;
}

// Durate associate a un codice di servizio
export type OreServizio = {
  colloquio: number;
  backOffice: number;
};

// Struttura di una riga della tabella della homepage
export type DetenutoRow = {
  id: number;
  detenuto: string;
  data_primo_colloquio: string | null;
  servizi: Record<string, OreServizio>;
};
