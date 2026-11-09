"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";
import { inserisciDetenuto } from "@/src/lib/actions/inserisciDetenuto";

type InserimentoCompletato = {
   id: number;
   nominativo: string;
};

export default function AnagraficaForm() {
   const formRef = useRef<HTMLFormElement>(null);

   const [isPending, startTransition] = useTransition();
   const [error, setError] = useState<string | null>(null);

   const [inserito, setInserito] = useState<InserimentoCompletato | null>(null);

   function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
      event.preventDefault();

      if (isPending) return;

      const formData = new FormData(event.currentTarget);

      const nome = String(formData.get("nome") ?? "").trim();
      const cognome = String(formData.get("cognome") ?? "").trim();

      const dataNascita = String(formData.get("dataNascita") ?? "").trim() || null;

      const dataPrimoColloquio = String(formData.get("dataPrimoColloquio") ?? "").trim() || null;

      const note = String(formData.get("note") ?? "").trim() || null;

      if (!nome || !cognome) {
         setError("Nome e cognome sono obbligatori.");
         return;
      }

      setError(null);
      setInserito(null);

      startTransition(async () => {
         try {
            const result = await inserisciDetenuto({
               nome,
               cognome,
               dataNascita,
               dataPrimoColloquio,
               note,
            });

            if (!result.success) {
               setError(result.error);
               return;
            }

            setInserito({
               id: result.detenutoId,
               nominativo: `${cognome} ${nome}`,
            });

            formRef.current?.reset();
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante l'inserimento dell'anagrafica.");
         }
      });
   }

   return (
      <div className="w-full">
         {/* Conferma dell'ultimo inserimento */}
         {inserito && (
            <div
               role="status"
               className="
                  mb-5 rounded-xl
                  border border-emerald-400/40
                  bg-emerald-400/10
                  p-5
               "
            >
               <h2 className="text-base font-semibold text-emerald-300">Anagrafica inserita correttamente</h2>

               <p className="mt-2 text-sm text-foreground">{inserito.nominativo} è stato aggiunto al database.</p>

               <Link
                  href={`/scheda-individuale/${inserito.id}`}
                  className="
                     mt-3 inline-block text-sm font-medium
                     text-primary hover:underline
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-primary
                  "
               >
                  Apri la Scheda Individuale
               </Link>

               <p className="mt-2 text-xs text-muted">
                  Puoi compilare il modulo sottostante per inserire un'altra anagrafica.
               </p>
            </div>
         )}

         <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="
               rounded-xl border border-border
               bg-lightbg p-5 shadow-sm
               sm:p-6
            "
         >
            <div className="mb-6">
               <h2 className="text-lg font-semibold text-primary">Nuova anagrafica</h2>

               <p className="mt-1 text-sm text-muted">
                  Inserisci i dati del detenuto. I campi contrassegnati con * sono obbligatori.
               </p>
            </div>

            {/* Nome e cognome */}
            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
               <div>
                  <label htmlFor="anagrafica-cognome" className="mb-2 block text-sm font-medium text-muted-strong">
                     Cognome *
                  </label>

                  <input
                     id="anagrafica-cognome"
                     name="cognome"
                     type="text"
                     required
                     maxLength={100}
                     autoComplete="off"
                     disabled={isPending}
                     placeholder="Inserisci il cognome"
                     className="
                        w-full rounded-lg
                        border border-border-strong
                        bg-surface-input
                        px-4 py-3
                        text-sm text-foreground
                        placeholder:text-muted-subtle
                        outline-none
                        transition-colors
                        focus:border-primary
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />
               </div>

               <div>
                  <label htmlFor="anagrafica-nome" className="mb-2 block text-sm font-medium text-muted-strong">
                     Nome *
                  </label>

                  <input
                     id="anagrafica-nome"
                     name="nome"
                     type="text"
                     required
                     maxLength={100}
                     autoComplete="off"
                     disabled={isPending}
                     placeholder="Inserisci il nome"
                     className="
                        w-full rounded-lg
                        border border-border-strong
                        bg-surface-input
                        px-4 py-3
                        text-sm text-foreground
                        placeholder:text-muted-subtle
                        outline-none
                        transition-colors
                        focus:border-primary
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />
               </div>
            </div>

            {/* Date */}
            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
               <div>
                  <label htmlFor="anagrafica-data-nascita" className="mb-2 block text-sm font-medium text-muted-strong">
                     Data di nascita
                  </label>

                  <input
                     id="anagrafica-data-nascita"
                     name="dataNascita"
                     type="date"
                     disabled={isPending}
                     className="
                        w-full rounded-lg
                        border border-border-strong
                        bg-surface-input
                        px-4 py-3
                        text-sm text-foreground
                        outline-none
                        transition-colors
                        focus:border-primary
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />
               </div>

               <div>
                  <label
                     htmlFor="anagrafica-primo-colloquio"
                     className="mb-2 block text-sm font-medium text-muted-strong"
                  >
                     Data primo colloquio
                  </label>

                  <input
                     id="anagrafica-primo-colloquio"
                     name="dataPrimoColloquio"
                     type="date"
                     disabled={isPending}
                     className="
                        w-full rounded-lg
                        border border-border-strong
                        bg-surface-input
                        px-4 py-3
                        text-sm text-foreground
                        outline-none
                        transition-colors
                        focus:border-primary
                        focus:ring-1 focus:ring-primary-hover/30
                        disabled:opacity-50
                     "
                  />
               </div>
            </div>

            {/* Note */}
            <div className="mb-6">
               <label htmlFor="anagrafica-note" className="mb-2 block text-sm font-medium text-muted-strong">
                  Note
               </label>

               <textarea
                  id="anagrafica-note"
                  name="note"
                  rows={5}
                  disabled={isPending}
                  placeholder="Eventuali annotazioni anagrafiche..."
                  className="
                     min-h-32 w-full resize-y
                     rounded-lg
                     border border-border-strong
                     bg-surface-input
                     px-4 py-3
                     text-sm leading-relaxed text-foreground
                     placeholder:text-muted-subtle
                     outline-none
                     transition-colors
                     focus:border-primary
                     focus:ring-1 focus:ring-primary-hover/30
                     disabled:opacity-50
                  "
               />
            </div>

            {/* Errori */}
            {error && (
               <p role="alert" className="mb-4 text-sm text-danger">
                  {error}
               </p>
            )}

            {/* Pulsanti */}
            <div className="flex flex-wrap items-center justify-end gap-3">
               <button
                  type="reset"
                  disabled={isPending}
                  onClick={() => setError(null)}
                  className="
                     rounded-lg border border-border-strong
                     px-4 py-2.5
                     text-sm text-muted-strong
                     transition-colors
                     hover:bg-surface-hover
                     disabled:cursor-not-allowed
                     disabled:opacity-50
                  "
               >
                  Pulisci campi
               </button>

               <button
                  type="submit"
                  disabled={isPending}
                  className="
                     inline-flex min-w-44
                     items-center justify-center gap-2
                     rounded-lg
                     border border-primary-border
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
                        <LoadingSpinner size="sm" label="Inserimento anagrafica" />
                        Salvataggio...
                     </>
                  ) : (
                     "Salva anagrafica"
                  )}
               </button>
            </div>
         </form>
      </div>
   );
}
