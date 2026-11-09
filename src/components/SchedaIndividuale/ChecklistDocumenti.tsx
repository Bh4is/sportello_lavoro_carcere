"use client";

import { useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";
import NuovoDocumento from "@/src/components/SchedaIndividuale/NuovoDocumento";

import { aggiornaStatoDocumento } from "@/src/lib/actions/documenti";

import type { DocumentoDetenuto, StatoDocumento } from "@/src/lib/queries/documenti";

type ChecklistDocumentiProps = {
   detenutoId: number;
   documenti: DocumentoDetenuto[];
};

type DocumentoItemProps = {
   detenutoId: number;
   documento: DocumentoDetenuto;
};

const stati = [
   { value: "si", label: "Sì" },
   { value: "no", label: "No" },
   { value: "in_corso", label: "In corso" },
] as const;

/**
 * Singola voce della checklist.
 *
 * Ogni documento gestisce autonomamente
 * il proprio stato e il salvataggio.
 */
function DocumentoItem({ detenutoId, documento }: DocumentoItemProps) {
   const [stato, setStato] = useState<StatoDocumento>(documento.stato);

   const [error, setError] = useState<string | null>(null);
   const [isPending, startTransition] = useTransition();

   function handleChange(nuovoStato: StatoDocumento) {
      if (isPending || nuovoStato === stato) {
         return;
      }

      setError(null);

      startTransition(async () => {
         try {
            const result = await aggiornaStatoDocumento(detenutoId, documento.id, nuovoStato);

            if (!result.success) {
               setError(result.error);
               return;
            }

            setStato(nuovoStato);
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
         }
      });
   }

   return (
      <div
         className="
            rounded-lg border border-border
            bg-slate-900/40 p-4
         "
      >
         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Nome e descrizione */}
            <div className="min-w-0 flex-1">
               <h3 className="text-sm font-semibold text-foreground">{documento.nome}</h3>

               {documento.descrizione && <p className="mt-1 text-xs text-muted">{documento.descrizione}</p>}
            </div>

            {/* Selezione dello stato */}
            <div className="flex flex-wrap items-center gap-3">
               <fieldset
                  disabled={isPending}
                  aria-label={`Stato documento: ${documento.nome}`}
                  className="flex flex-wrap items-center gap-2"
               >
                  {stati.map((opzione) => {
                     const selected = stato === opzione.value;

                     return (
                        <label
                           key={opzione.value}
                           className={`
                              inline-flex cursor-pointer
                              items-center justify-center
                              rounded-lg border px-3 py-2
                              text-xs font-medium transition-colors
                              ${
                                 selected
                                    ? "border-primary-hover bg-sky-400/15 text-primary"
                                    : "border-border-strong bg-slate-800 text-muted-strong hover:border-slate-500 hover:bg-surface-raised"
                              }
                              ${isPending ? "cursor-not-allowed opacity-50" : ""}
                           `}
                        >
                           <input
                              type="radio"
                              name={`documento-${detenutoId}-${documento.id}`}
                              value={opzione.value}
                              checked={selected}
                              onChange={() => handleChange(opzione.value)}
                              className="mr-2 accent-sky-400"
                           />

                           {opzione.label}
                        </label>
                     );
                  })}
               </fieldset>

               {/* Ripristino dello stato */}
               {stato !== null && (
                  <button
                     type="button"
                     onClick={() => handleChange(null)}
                     disabled={isPending}
                     className="
                        rounded-lg border border-border-strong
                        px-3 py-2 text-xs text-muted
                        transition-colors hover:bg-surface-raised
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                     "
                     title="Riporta il documento a Non impostato"
                  >
                     Reimposta
                  </button>
               )}

               {/* Spinner */}
               {isPending && (
                  <div className="flex items-center gap-2 text-primary">
                     <LoadingSpinner size="sm" label="Salvataggio stato documento" />

                     <span className="text-xs">Salvataggio...</span>
                  </div>
               )}
            </div>
         </div>

         {/* Stato iniziale */}
         {stato === null && !isPending && (
            <p className="mt-3 text-xs italic text-muted-subtle">Stato non ancora impostato</p>
         )}

         {/* Errori */}
         {error && (
            <p role="alert" className="mt-3 text-xs text-danger">
               {error}
            </p>
         )}
      </div>
   );
}

/**
 * Checklist documentale del detenuto.
 *
 * Comprende:
 * - catalogo dei documenti
 * - inserimento di nuove tipologie
 * - selezione degli stati individuali
 */
export default function ChecklistDocumenti({ detenutoId, documenti }: ChecklistDocumentiProps) {
   const completati = documenti.filter((documento) => documento.stato === "si").length;

   return (
      <div className="w-full">
         {/* Intestazione */}
         <div className="mb-6">
            <h2 className="text-lg font-semibold text-primary">Checklist documenti</h2>

            <p className="mt-1 text-xs text-muted">
               Verifica la disponibilità dei documenti e lo stato delle pratiche del detenuto.
            </p>
         </div>

         {/* Aggiunta di nuove tipologie */}
         <div className="mb-6">
            <NuovoDocumento />
         </div>

         {/* Riepilogo */}
         <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
               className="
                  rounded-lg border border-border-strong
                  bg-slate-900/40 px-3 py-2
                  text-xs text-muted-strong
               "
            >
               Documenti disponibili: {completati} / {documenti.length}
            </span>
         </div>

         {/* Elenco documenti */}
         {documenti.length === 0 ? (
            <div
               className="
                  rounded-lg border border-dashed
                  border-border-strong bg-slate-900/30
                  px-6 py-10 text-center
               "
            >
               <p className="text-sm font-medium text-muted-strong">Nessun documento configurato</p>

               <p className="mt-2 text-xs text-muted">
                  Aggiungi una tipologia di documento per iniziare a utilizzare la checklist.
               </p>
            </div>
         ) : (
            <div className="space-y-3">
               {documenti.map((documento) => (
                  <DocumentoItem key={`${detenutoId}-${documento.id}`} detenutoId={detenutoId} documento={documento} />
               ))}
            </div>
         )}
      </div>
   );
}
