"use client";

import { useId, useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";
import { aggiungiTipologiaDocumento } from "@/src/lib/actions/documenti";

type NuovoDocumentoProps = {
   onCreated?: () => void;
};

/**
 * Modulo per aggiungere una nuova tipologia
 * al catalogo condiviso dei documenti.
 *
 * Utilizza Server Actions e useTransition.
 */
export default function NuovoDocumento({ onCreated }: NuovoDocumentoProps) {
   const formId = useId();

   const [isOpen, setIsOpen] = useState(false);
   const [nome, setNome] = useState("");
   const [descrizione, setDescrizione] = useState("");
   const [error, setError] = useState<string | null>(null);

   const [isPending, startTransition] = useTransition();

   function handleOpen() {
      setNome("");
      setDescrizione("");
      setError(null);
      setIsOpen(true);
   }

   function handleCancel() {
      if (isPending) return;

      setIsOpen(false);
      setNome("");
      setDescrizione("");
      setError(null);
   }

   function handleSave() {
      if (isPending) return;

      const nuovoNome = nome.trim();
      const nuovaDescrizione = descrizione.trim();

      if (!nuovoNome) {
         setError("Inserisci il nome del documento.");
         return;
      }

      if (nuovoNome.length > 150) {
         setError("Il nome non può superare 150 caratteri.");
         return;
      }

      setError(null);

      startTransition(async () => {
         try {
            const result = await aggiungiTipologiaDocumento(nuovoNome, nuovaDescrizione || null);

            if (!result.success) {
               setError(result.error);
               return;
            }

            setIsOpen(false);
            setNome("");
            setDescrizione("");
            setError(null);

            onCreated?.();
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante la creazione del documento.");
         }
      });
   }

   return (
      <div className="w-full">
         {!isOpen ? (
            <button
               type="button"
               onClick={handleOpen}
               className="
                  rounded-lg border border-primary-border
                  bg-primary-soft px-4 py-2.5
                  text-sm font-medium text-primary
                  transition-colors hover:bg-primary-hover/20
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-sky-400
               "
            >
               + Aggiungi documento
            </button>
         ) : (
            <div className="rounded-xl border border-border-strong bg-slate-900/50 p-5">
               <h3 className="mb-2 text-base font-semibold text-primary">Nuova tipologia di documento</h3>

               <p className="mb-5 text-xs text-muted">
                  Il documento sarà disponibile nelle checklist di tutti i detenuti.
               </p>

               <div className="mb-5">
                  <label htmlFor={`${formId}-nome`} className="mb-2 block text-xs font-medium text-muted">
                     Nome del documento
                  </label>

                  <input
                     id={`${formId}-nome`}
                     type="text"
                     value={nome}
                     onChange={(event) => setNome(event.target.value)}
                     disabled={isPending}
                     maxLength={150}
                     placeholder="Es. Attestato di formazione"
                     className="
                        w-full rounded-lg
                        border border-border-strong bg-surface-input
                        px-4 py-3 text-sm text-foreground
                        placeholder:text-muted-subtle outline-none
                        focus:border-primary-hover
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />
               </div>

               <div className="mb-5">
                  <label htmlFor={`${formId}-descrizione`} className="mb-2 block text-xs font-medium text-muted">
                     Descrizione (facoltativa)
                  </label>

                  <textarea
                     id={`${formId}-descrizione`}
                     value={descrizione}
                     onChange={(event) => setDescrizione(event.target.value)}
                     disabled={isPending}
                     rows={3}
                     placeholder="Breve descrizione del documento..."
                     className="
                        min-h-24 w-full resize-y rounded-lg
                        border border-border-strong bg-surface-input
                        px-4 py-3 text-sm text-foreground
                        placeholder:text-muted-subtle outline-none
                        focus:border-primary-hover
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />
               </div>

               {error && (
                  <p role="alert" className="mb-4 text-sm text-danger">
                     {error}
                  </p>
               )}

               <div className="flex justify-end gap-3">
                  <button
                     type="button"
                     onClick={handleCancel}
                     disabled={isPending}
                     className="
                        rounded-lg border border-border-strong
                        px-4 py-2.5 text-sm text-muted-strong
                        transition-colors hover:bg-surface-raised
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
                        inline-flex min-w-36 items-center
                        justify-center gap-2 rounded-lg
                        border border-primary-border bg-primary-soft
                        px-4 py-2.5 text-sm font-medium
                        text-primary transition-colors
                        hover:bg-primary-hover/20
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                     "
                  >
                     {isPending ? (
                        <>
                           <LoadingSpinner size="sm" label="Creazione documento in corso" />
                           Salvataggio...
                        </>
                     ) : (
                        "Aggiungi documento"
                     )}
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
