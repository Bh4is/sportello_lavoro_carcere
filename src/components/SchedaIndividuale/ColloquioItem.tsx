"use client";

import { useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";

import { modificaColloquio, eliminaColloquio } from "@/src/lib/actions/colloqui";

import type { ColloquioDetenuto } from "@/src/lib/queries/colloquiDetenuti";

type ColloquioItemProps = {
   colloquio: ColloquioDetenuto;
   detenutoId: number;
};

type Operazione = "modifica" | "elimina" | null;

/**
 * Formatta una data YYYY-MM-DD in DD/MM/YYYY.
 */
function formatDate(value: string): string {
   const [year, month, day] = value.split("-");

   if (!year || !month || !day) {
      return value;
   }

   return `${day}/${month}/${year}`;
}

/**
 * Componente per visualizzare, modificare
 * ed eliminare un singolo colloquio.
 *
 * Utilizza Server Actions e useTransition.
 */
export default function ColloquioItem({ colloquio, detenutoId }: ColloquioItemProps) {
   const [isEditing, setIsEditing] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);

   const [dataColloquio, setDataColloquio] = useState(colloquio.data_colloquio);

   const [contenuto, setContenuto] = useState(colloquio.contenuto);

   const [error, setError] = useState<string | null>(null);
   const [operazione, setOperazione] = useState<Operazione>(null);

   const [isPending, startTransition] = useTransition();

   /**
    * Apre la modifica ripristinando i valori
    * attualmente presenti nel database.
    */
   function handleEdit() {
      if (isPending) return;

      setDataColloquio(colloquio.data_colloquio);
      setContenuto(colloquio.contenuto);
      setError(null);
      setIsDeleting(false);
      setIsEditing(true);
   }

   /**
    * Annulla la modifica senza salvare.
    */
   function handleCancelEdit() {
      if (isPending) return;

      setDataColloquio(colloquio.data_colloquio);
      setContenuto(colloquio.contenuto);
      setError(null);
      setIsEditing(false);
   }

   /**
    * Modifica data e resoconto tramite Server Action.
    */
   function handleSave() {
      if (isPending) return;

      if (!dataColloquio) {
         setError("Seleziona la data del colloquio.");
         return;
      }

      if (!contenuto.trim()) {
         setError("Il resoconto non può essere vuoto.");
         return;
      }

      const nuovaData = dataColloquio;
      const nuovoContenuto = contenuto.trim();

      setError(null);
      setOperazione("modifica");

      startTransition(async () => {
         try {
            const result = await modificaColloquio(detenutoId, colloquio.id, nuovaData, nuovoContenuto);

            if (!result.success) {
               setError(result.error);
               return;
            }

            setIsEditing(false);
            setError(null);
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
         } finally {
            setOperazione(null);
         }
      });
   }

   /**
    * Elimina il colloquio tramite Server Action.
    *
    * Viene chiamata soltanto dopo che l'operatrice
    * ha confermato l'eliminazione.
    */
   function handleDelete() {
      if (isPending) return;

      setError(null);
      setOperazione("elimina");

      startTransition(async () => {
         try {
            const result = await eliminaColloquio(detenutoId, colloquio.id);

            if (!result.success) {
               setError(result.error);
               return;
            }

            setIsDeleting(false);
            setError(null);
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante l'eliminazione.");
         } finally {
            setOperazione(null);
         }
      });
   }

   return (
      <article
         className="
            overflow-hidden rounded-xl
            border border-border
            bg-slate-900/40
         "
      >
         {/* Intestazione */}
         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
               <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />

               <h3 className="text-sm font-semibold text-primary">
                  Colloquio del {formatDate(colloquio.data_colloquio)}
               </h3>
            </div>

            {!isEditing && !isDeleting && (
               <div className="flex items-center gap-2">
                  <button
                     type="button"
                     onClick={handleEdit}
                     disabled={isPending}
                     className="
                        rounded-lg border border-primary-border
                        px-3 py-2
                        text-xs font-medium text-primary
                        transition-colors
                        hover:bg-primary-soft
                        disabled:opacity-50
                     "
                  >
                     Modifica
                  </button>

                  <button
                     type="button"
                     onClick={() => {
                        if (isPending) return;
                        setError(null);
                        setIsDeleting(true);
                     }}
                     disabled={isPending}
                     className="
                        rounded-lg border border-red-400/40
                        px-3 py-2
                        text-xs font-medium text-danger
                        transition-colors
                        hover:bg-red-400/10
                        disabled:opacity-50
                     "
                  >
                     Elimina
                  </button>
               </div>
            )}
         </div>

         <div className="px-5 py-5">
            {/* Visualizzazione normale */}
            {!isEditing && !isDeleting && (
               <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-text-on-surface">
                  {colloquio.contenuto}
               </p>
            )}

            {/* Modifica del colloquio */}
            {isEditing && (
               <div className="space-y-5">
                  <div>
                     <label
                        htmlFor={`colloquio-data-${colloquio.id}`}
                        className="mb-2 block text-xs font-medium text-muted"
                     >
                        Data del colloquio
                     </label>

                     <input
                        id={`colloquio-data-${colloquio.id}`}
                        type="date"
                        value={dataColloquio}
                        onChange={(event) => setDataColloquio(event.target.value)}
                        disabled={isPending}
                        className="
                           w-full rounded-lg
                           border border-border-strong
                           bg-surface-input
                           px-3 py-2.5
                           text-sm text-foreground
                           outline-none
                           focus:border-primary-hover
                           disabled:opacity-50
                           sm:w-64
                        "
                     />
                  </div>

                  <div>
                     <label
                        htmlFor={`colloquio-contenuto-${colloquio.id}`}
                        className="mb-2 block text-xs font-medium text-muted"
                     >
                        Resoconto del colloquio
                     </label>

                     <textarea
                        id={`colloquio-contenuto-${colloquio.id}`}
                        value={contenuto}
                        onChange={(event) => setContenuto(event.target.value)}
                        disabled={isPending}
                        rows={8}
                        className="
                           min-h-48 w-full resize-y
                           rounded-lg
                           border border-border-strong
                           bg-surface-input
                           px-4 py-3
                           text-sm leading-relaxed text-foreground
                           outline-none
                           focus:border-primary-hover
                           disabled:opacity-50
                        "
                     />
                  </div>

                  <div className="flex justify-end gap-2">
                     <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        className="
                           rounded-lg border border-border-strong
                           px-4 py-2
                           text-sm text-muted-strong
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
                           inline-flex min-w-40
                           items-center justify-center gap-2
                           rounded-lg border border-primary-border
                           bg-primary-soft
                           px-4 py-2
                           text-sm font-medium text-primary
                           hover:bg-primary-hover/20
                           disabled:cursor-not-allowed
                           disabled:opacity-50
                        "
                     >
                        {isPending && operazione === "modifica" ? (
                           <>
                              <LoadingSpinner size="sm" label="Salvataggio modifiche" />
                              Salvataggio...
                           </>
                        ) : (
                           "Salva modifiche"
                        )}
                     </button>
                  </div>
               </div>
            )}

            {/* Conferma eliminazione */}
            {isDeleting && (
               <div className="space-y-4">
                  <p className="text-sm font-medium text-red-300">Vuoi eliminare questo colloquio?</p>

                  <p className="text-sm text-muted">
                     Il resoconto verrà eliminato definitivamente dal database. Questa operazione non può essere
                     annullata.
                  </p>

                  <div className="flex justify-end gap-2">
                     <button
                        type="button"
                        onClick={() => {
                           if (isPending) return;
                           setIsDeleting(false);
                           setError(null);
                        }}
                        disabled={isPending}
                        className="
                           rounded-lg border border-border-strong
                           px-4 py-2
                           text-sm text-muted-strong
                           hover:bg-surface-raised
                           disabled:cursor-not-allowed
                           disabled:opacity-50
                        "
                     >
                        Annulla
                     </button>

                     <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="
                           inline-flex min-w-44
                           items-center justify-center gap-2
                           rounded-lg border border-red-400/40
                           bg-red-400/10
                           px-4 py-2
                           text-sm font-medium text-red-300
                           hover:bg-red-400/20
                           disabled:cursor-not-allowed
                           disabled:opacity-50
                        "
                     >
                        {isPending && operazione === "elimina" ? (
                           <>
                              <LoadingSpinner size="sm" label="Eliminazione colloquio" />
                              Eliminazione...
                           </>
                        ) : (
                           "Conferma eliminazione"
                        )}
                     </button>
                  </div>
               </div>
            )}

            {/* Messaggi di errore */}
            {error && (
               <p role="alert" className="mt-4 text-sm text-danger">
                  {error}
               </p>
            )}
         </div>
      </article>
   );
}
