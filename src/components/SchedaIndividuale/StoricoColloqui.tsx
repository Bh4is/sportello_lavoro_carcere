"use client";

import NuovoColloquio from "@/src/components/SchedaIndividuale/NuovoColloquio";
import ColloquioItem from "@/src/components/SchedaIndividuale/ColloquioItem";

import type { CodiceServizioColloquio, ColloquioDetenuto } from "@/src/lib/queries/colloquiDetenuti";

type StoricoColloquiProps = {
   detenutoId: number;
   colloqui: ColloquioDetenuto[];
   codici: CodiceServizioColloquio[];
};

/**
 * Visualizza lo storico dei colloqui
 * e permette di registrarne di nuovi.
 *
 * I codici di servizio vengono recuperati
 * da MariaDB nella pagina server.
 */
export default function StoricoColloqui({ detenutoId, colloqui, codici }: StoricoColloquiProps) {
   return (
      <div className="w-full">
         {/* Intestazione */}
         <div className="mb-5">
            <h2 className="text-lg font-semibold text-primary">Storico colloqui</h2>

            <p className="mt-1 text-xs text-muted">
               {colloqui.length === 1 ? "1 colloquio registrato" : `${colloqui.length} colloqui registrati`}
            </p>
         </div>

         {/* Registrazione nuovo colloquio */}
         <div className="mb-6 w-full">
            <NuovoColloquio detenutoId={detenutoId} codici={codici} />
         </div>

         {/* Storico colloqui */}
         {colloqui.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-slate-900/30 px-6 py-10 text-center">
               <p className="text-sm font-medium text-muted-strong">Nessun colloquio registrato</p>

               <p className="mt-2 text-xs text-muted">
                  Utilizza il pulsante Nuovo colloquio per inserire il primo resoconto.
               </p>
            </div>
         ) : (
            <div className="space-y-4">
               {colloqui.map((colloquio) => (
                  <ColloquioItem key={colloquio.id} detenutoId={detenutoId} colloquio={colloquio} codici={codici} />
               ))}
            </div>
         )}
      </div>
   );
}
