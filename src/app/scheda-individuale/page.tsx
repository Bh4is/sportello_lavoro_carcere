import { Suspense } from "react";

import PageTitle from "@/src/components/Ui/PageTitle";
import DetenutoSearch from "@/src/components/SchedaIndividuale/DetenutoSearch";

import { getDetenutiSearch } from "@/src/lib/queries/detenuti";

/**
 * Componente server.
 *
 * Recupera l'elenco dei detenuti da MariaDB
 * e lo passa al componente di ricerca.
 */
async function DetenutoSearchServer() {
   const detenuti = await getDetenutiSearch();

   return <DetenutoSearch detenuti={detenuti} />;
}

/**
 * Pagina principale della Scheda Individuale.
 *
 * Quando nessun detenuto è selezionato,
 * viene visualizzata soltanto la barra di ricerca.
 */
export default function SchedaIndividualePage() {
   return (
      <>
         <title>Scheda Individuale - SLC</title>

         <div className="flex h-full min-h-0 flex-col">
            <PageTitle>Scheda Individuale</PageTitle>

            <div className="mx-auto mt-4 w-[95%] max-w-6xl">
               <div className="rounded-xl border border-border bg-lightbg p-6 shadow-sm">
                  <Suspense
                     fallback={
                        <div className="rounded-lg border border-border-strong bg-surface-input px-4 py-3 text-sm text-muted">
                           Caricamento elenco detenuti...
                        </div>
                     }
                  >
                     <DetenutoSearchServer />
                  </Suspense>

                  <p className="mt-3 text-xs text-muted">
                     Seleziona un detenuto per visualizzare la sua scheda individuale.
                  </p>
               </div>
            </div>
         </div>
      </>
   );
}
