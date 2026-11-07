import BaseTable, { type Column } from "@/src/components/Table/BaseTable";

import { getRiepilogoOreMensili } from "@/src/lib/queries/ore";
import { formatDurata } from "@/src/lib/utils/format";

import type { OreMensiliRow } from "@/src/types/ore";

/**
 * Tabella riepilogativa delle ore mensili.
 */
export default async function OreTable() {
   const mesi = await getRiepilogoOreMensili();

   // Calcola i totali complessivi
   const totali = mesi.reduce(
      (acc, mese) => ({
         colloquio: acc.colloquio + mese.minutiColloquio,
         backOffice: acc.backOffice + mese.minutiBackOffice,
         totale: acc.totale + mese.minutiTotali,
      }),
      {
         colloquio: 0,
         backOffice: 0,
         totale: 0,
      },
   );

   // Colonne della tabella mensile
   const columns: Column<OreMensiliRow>[] = [
      {
         header: "Mese",
         className: "text-left",
         render: (row) => (
            <span className="font-medium">
               {row.nomeMese} {row.anno}
            </span>
         ),
      },
      {
         header: "Ore colloquio",
         className: "tabular-nums",
         render: (row) => formatDurata(row.minutiColloquio),
      },
      {
         header: "Ore back office",
         className: "tabular-nums",
         render: (row) => formatDurata(row.minutiBackOffice),
      },
      {
         header: "Totale",
         className: "tabular-nums",
         render: (row) => <span className="font-semibold text-primary">{formatDurata(row.minutiTotali)}</span>,
      },
   ];

   return (
      <div className="flex h-full min-h-0 flex-col">
         {/* Riquadri dei totali in alto */}
         {mesi.length > 0 && (
            <div className="mx-auto mt-4 grid w-19/20 grid-cols-1 gap-3 sm:grid-cols-3">
               {/* Totale colloqui */}
               <div className="rounded-xl border border-slate-700 bg-lightbg p-4">
                  <p className="text-xs text-slate-400">Totale ore colloquio</p>
                  <p className="mt-1 text-xl font-semibold text-slate-100 tabular-nums">
                     {formatDurata(totali.colloquio)}
                  </p>
               </div>

               {/* Totale back office */}
               <div className="rounded-xl border border-slate-700 bg-lightbg p-4">
                  <p className="text-xs text-slate-400">Totale ore back office</p>
                  <p className="mt-1 text-xl font-semibold text-slate-100 tabular-nums">
                     {formatDurata(totali.backOffice)}
                  </p>
               </div>

               {/* Totale complessivo */}
               <div className="rounded-xl border border-slate-700 bg-lightbg p-4">
                  <p className="text-xs text-slate-400">Totale complessivo</p>
                  <p className="mt-1 text-xl font-semibold text-primary tabular-nums">{formatDurata(totali.totale)}</p>
               </div>
            </div>
         )}

         {/* Tabella riepilogativa per mese */}
         <div className="min-h-0 flex-1">
            <BaseTable
               columns={columns}
               rows={mesi}
               getRowKey={(row) => row.id}
               compact={false}
               fullWidth={true}
               fillHeight={false}
               emptyMessage="Nessuna attività registrata"
            />
         </div>
      </div>
   );
}
