import { Suspense } from "react";
import { notFound } from "next/navigation";

import PageTitle from "@/src/components/Ui/PageTitle";
import DetenutoSearch from "@/src/components/SchedaIndividuale/DetenutoSearch";
import SchedaTabs from "@/src/components/SchedaIndividuale/SchedaTabs";
import DatiAnagrafici from "@/src/components/SchedaIndividuale/DatiAnagrafici";
import StoricoColloqui from "@/src/components/SchedaIndividuale/StoricoColloqui";
import ChecklistDocumenti from "@/src/components/SchedaIndividuale/ChecklistDocumenti";

import { getDetenutiSearch, getDetenutoById } from "@/src/lib/queries/detenuti";

import { getColloquiDetenuto } from "@/src/lib/queries/colloquiDetenuti";
import { getDocumentiDetenuto } from "@/src/lib/queries/documenti";

type SchedaDetenutoPageProps = {
   params: Promise<{
      id: string;
   }>;
};

/**
 * Componente server per la barra di ricerca.
 *
 * Recupera l'elenco dei detenuti da MariaDB.
 */
async function DetenutoSearchServer() {
   const detenuti = await getDetenutiSearch();

   return <DetenutoSearch detenuti={detenuti} />;
}

/**
 * Contenuto della scheda individuale.
 *
 * Recupera in parallelo:
 * - dati anagrafici
 * - storico dei colloqui
 * - checklist documenti
 */
async function SchedaDetenutoContent({ id }: { id: number }) {
   const [detenuto, colloqui, documenti] = await Promise.all([
      getDetenutoById(id),
      getColloquiDetenuto(id),
      getDocumentiDetenuto(id),
   ]);

   if (!detenuto) {
      notFound();
   }

   const nominativo = [detenuto.nome, detenuto.cognome].filter(Boolean).join(" ");

   return (
      <>
         <title>{`Scheda ${nominativo} - SLC`}</title>

         <PageTitle>Scheda {nominativo}</PageTitle>

         <div className="mx-auto mt-4 w-[95%] max-w-6xl">
            {/* Barra di ricerca */}
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
            </div>

            {/* Tab interattive */}
            <SchedaTabs
               anagrafica={<DatiAnagrafici detenuto={detenuto} />}
               colloqui={<StoricoColloqui detenutoId={detenuto.id} colloqui={colloqui} />}
               documenti={<ChecklistDocumenti detenutoId={detenuto.id} documenti={documenti} />}
            />
         </div>
      </>
   );
}

/**
 * Risolve il parametro dinamico all'interno
 * del confine Suspense.
 */
async function SchedaDetenutoServer({ params }: SchedaDetenutoPageProps) {
   const { id } = await params;

   const detenutoId = Number(id);

   if (!/^\d+$/.test(id) || !Number.isSafeInteger(detenutoId) || detenutoId <= 0 || detenutoId > 4294967295) {
      notFound();
   }

   return <SchedaDetenutoContent id={detenutoId} />;
}

/**
 * Pagina dinamica.
 *
 * Suspense gestisce l'accesso ai parametri
 * dinamici e le interrogazioni MariaDB.
 */
export default function SchedaDetenutoPage({ params }: SchedaDetenutoPageProps) {
   return (
      <div className="flex h-full min-h-0 flex-col">
         <Suspense
            fallback={
               <div className="mx-auto mt-4 w-19/20 rounded-xl border border-border bg-lightbg p-8 text-center text-sm text-muted">
                  Caricamento scheda individuale...
               </div>
            }
         >
            <SchedaDetenutoServer params={params} />
         </Suspense>
      </div>
   );
}
