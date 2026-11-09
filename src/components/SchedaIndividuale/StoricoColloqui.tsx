"use client";

import NuovoColloquio from "@/src/components/SchedaIndividuale/NuovoColloquio";
import ColloquioItem from "@/src/components/SchedaIndividuale/ColloquioItem";

import type { ColloquioDetenuto } from "@/src/lib/queries/colloquiDetenuti";

type StoricoColloquiProps = {
   detenutoId: number;
   colloqui: ColloquioDetenuto[];
};

/**
 * Visualizza lo storico dei colloqui
 * di un singolo detenuto.
 *
 * I colloqui vengono recuperati dal server,
 * ordinati dal più recente al meno recente.
 *
 * Ogni colloquio è gestito da un componente
 * indipendente, modificabile ed eliminabile.
 */
export default function StoricoColloqui({ detenutoId, colloqui }: StoricoColloquiProps) {
   return (
      <div className="w-full">
         {/* Intestazione e pulsante di inserimento */}
         <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
               <h2 className="text-lg font-semibold text-primary">Storico colloqui</h2>

               <p className="mt-1 text-xs text-muted">
                  {colloqui.length === 1 ? "1 colloquio registrato" : `${colloqui.length} colloqui registrati`}
               </p>
            </div>

            <NuovoColloquio detenutoId={detenutoId} />
         </div>

         {/* Nessun colloquio presente */}
         {colloqui.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-slate-900/30 px-6 py-10 text-center">
               <p className="text-sm font-medium text-muted-strong">Nessun colloquio registrato</p>

               <p className="mt-2 text-xs text-muted">
                  Utilizza il pulsante Nuovo colloquio per inserire il primo resoconto.
               </p>
            </div>
         ) : (
            /* Elenco dei colloqui */
            <div className="space-y-4">
               {colloqui.map((colloquio) => (
                  <ColloquioItem key={colloquio.id} detenutoId={detenutoId} colloquio={colloquio} />
               ))}
            </div>
         )}
      </div>
   );
}
