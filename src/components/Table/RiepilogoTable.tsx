import RiepilogoTableClient from "@/src/components/Table/RiepilogoTableClient";

import { getDatiRiepilogo } from "@/src/lib/queries/riepilogo";

/**
 * Componente server:
 * recupera i dati da MariaDB e li passa
 * alla tabella interattiva.
 */
export default async function RiepilogoTable() {
   const { codici, detenuti } = await getDatiRiepilogo();

   // Trasforma i risultati mysql2 in oggetti semplici
   // serializzabili per il Client Component.
   const servizi = codici.map((servizio) => ({
      codice: servizio.codice,
      tipologia: servizio.tipologia,
   }));

   return <RiepilogoTableClient codici={servizi} detenuti={detenuti} />;
}
