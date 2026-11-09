"use client";

import { useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";
import { creaColloquio } from "@/src/lib/actions/colloqui";

type NuovoColloquioProps = {
   detenutoId: number;
};

/**
 * Restituisce la data locale nel formato YYYY-MM-DD.
 */
function getTodayLocal(): string {
   const today = new Date();

   const year = today.getFullYear();
   const month = String(today.getMonth() + 1).padStart(2, "0");
   const day = String(today.getDate()).padStart(2, "0");

   return `${year}-${month}-${day}`;
}

/**
 * Modulo per registrare un nuovo colloquio.
 *
 * Utilizza una Server Action per salvare su MariaDB
 * e useTransition per gestire lo stato di caricamento.
 */
export default function NuovoColloquio({ detenutoId }: NuovoColloquioProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [dataColloquio, setDataColloquio] = useState("");
   const [contenuto, setContenuto] = useState("");
   const [error, setError] = useState<string | null>(null);

   const [isPending, startTransition] = useTransition();

   function handleOpen() {
      setDataColloquio(getTodayLocal());
      setContenuto("");
      setError(null);
      setIsOpen(true);
   }

   function handleCancel() {
      if (isPending) {
         return;
      }

      setIsOpen(false);
      setDataColloquio("");
      setContenuto("");
      setError(null);
   }

   function handleSave() {
      if (isPending) {
         return;
      }

      if (!dataColloquio) {
         setError("Seleziona la data del colloquio.");
         return;
      }

      if (!contenuto.trim()) {
         setError("Inserisci il resoconto del colloquio.");
         return;
      }

      const dataDaSalvare = dataColloquio;
      const contenutoDaSalvare = contenuto.trim();

      setError(null);

      startTransition(async () => {
         try {
            const result = await creaColloquio(detenutoId, dataDaSalvare, contenutoDaSalvare);

            if (!result.success) {
               setError(result.error);
               return;
            }

            // Il colloquio è stato salvato.
            // La Server Action aggiorna già i dati
            // della pagina attraverso refresh().
            setIsOpen(false);
            setDataColloquio("");
            setContenuto("");
            setError(null);
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
         }
      });
   }

   return (
      <div className="w-full sm:w-auto">
         {!isOpen ? (
            <button
               type="button"
               onClick={handleOpen}
               className="
                  rounded-lg border border-primary-border
                  bg-primary-soft
                  px-4 py-2.5
                  text-sm font-medium text-primary
                  transition-colors
                  hover:bg-primary-hover/20
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-sky-400
               "
            >
               + Nuovo colloquio
            </button>
         ) : (
            <div
               className="
               w-full rounded-xl
               border border-border-strong
               bg-slate-900/50 p-5
               sm:min-w-96
            "
            >
               <h3 className="mb-5 text-base font-semibold text-primary">Registra nuovo colloquio</h3>

               {/* Data */}
               <div className="mb-5">
                  <label htmlFor="nuovo-colloquio-data" className="mb-2 block text-xs font-medium text-muted">
                     Data del colloquio
                  </label>

                  <input
                     id="nuovo-colloquio-data"
                     type="date"
                     value={dataColloquio}
                     onChange={(event) => setDataColloquio(event.target.value)}
                     disabled={isPending}
                     required
                     className="
                        w-full rounded-lg
                        border border-border-strong
                        bg-surface-input
                        px-3 py-2.5
                        text-sm text-foreground
                        outline-none
                        focus:border-primary-hover
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />
               </div>

               {/* Resoconto */}
               <div className="mb-5">
                  <label htmlFor="nuovo-colloquio-contenuto" className="mb-2 block text-xs font-medium text-muted">
                     Resoconto del colloquio
                  </label>

                  <textarea
                     id="nuovo-colloquio-contenuto"
                     value={contenuto}
                     onChange={(event) => setContenuto(event.target.value)}
                     disabled={isPending}
                     placeholder="Inserisci il resoconto del colloquio..."
                     rows={8}
                     required
                     className="
                        min-h-48 w-full resize-y
                        rounded-lg
                        border border-border-strong
                        bg-surface-input
                        px-4 py-3
                        text-sm leading-relaxed text-foreground
                        placeholder:text-muted-subtle
                        outline-none
                        focus:border-primary-hover
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />

                  <p className="mt-2 text-xs text-muted-subtle">
                     Puoi inserire un resoconto dettagliato, anche su più righe.
                  </p>
               </div>

               {/* Errori */}
               {error && (
                  <p role="alert" className="mb-4 text-sm text-danger">
                     {error}
                  </p>
               )}

               {/* Pulsanti */}
               <div className="flex justify-end gap-3">
                  <button
                     type="button"
                     onClick={handleCancel}
                     disabled={isPending}
                     className="
                        rounded-lg border border-border-strong
                        px-4 py-2.5
                        text-sm text-muted-strong
                        transition-colors
                        hover:bg-surface-raised
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                     "
                  >
                     Annulla
                  </button>

                  <button
                     type="button"
                     onClick={handleSave}
                     disabled={isPending}
                     className="
                        inline-flex min-w-36
                        items-center justify-center gap-2
                        rounded-lg border border-primary-border
                        bg-primary-soft
                        px-4 py-2.5
                        text-sm font-medium text-primary
                        transition-colors
                        hover:bg-primary-hover/20
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                     "
                  >
                     {isPending ? (
                        <>
                           <LoadingSpinner size="sm" label="Salvataggio colloquio" />
                           Salvataggio...
                        </>
                     ) : (
                        "Salva colloquio"
                     )}
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
