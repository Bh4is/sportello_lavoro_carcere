"use client";

import { useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";
import NuovoDocumento from "@/src/components/SchedaIndividuale/NuovoDocumento";

import { aggiornaStatoDocumento, aggiornaNoteDocumento } from "@/src/lib/actions/documenti";

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
 * Stato e note vengono gestiti e salvati
 * indipendentemente.
 */
function DocumentoItem({ detenutoId, documento }: DocumentoItemProps) {
   const [stato, setStato] = useState<StatoDocumento>(documento.stato);

   const [errorStato, setErrorStato] = useState<string | null>(null);
   const [isPendingStato, startTransitionStato] = useTransition();

   // Note salvate nel database e testo attualmente modificato.
   const [noteSalvate, setNoteSalvate] = useState(documento.note ?? "");
   const [note, setNote] = useState(documento.note ?? "");

   const [errorNote, setErrorNote] = useState<string | null>(null);
   const [noteConfermate, setNoteConfermate] = useState(false);
   const [isPendingNote, startTransitionNote] = useTransition();

   const noteModificate = note !== noteSalvate;

   /**
    * Aggiorna soltanto lo stato del documento.
    */
   function handleChange(nuovoStato: StatoDocumento) {
      if (isPendingStato || nuovoStato === stato) {
         return;
      }

      setErrorStato(null);

      startTransitionStato(async () => {
         try {
            const result = await aggiornaStatoDocumento(detenutoId, documento.id, nuovoStato);

            if (!result.success) {
               setErrorStato(result.error);
               return;
            }

            setStato(nuovoStato);
         } catch (err) {
            setErrorStato(err instanceof Error ? err.message : "Errore durante il salvataggio dello stato.");
         }
      });
   }

   /**
    * Aggiorna il testo delle note.
    */
   function handleNoteChange(value: string) {
      setNote(value);
      setErrorNote(null);
      setNoteConfermate(false);
   }

   /**
    * Salva le note senza modificare lo stato.
    */
   function handleSalvaNote() {
      if (isPendingNote || !noteModificate) {
         return;
      }

      const noteDaSalvare = note;

      setErrorNote(null);
      setNoteConfermate(false);

      startTransitionNote(async () => {
         try {
            const result = await aggiornaNoteDocumento(detenutoId, documento.id, noteDaSalvare);

            if (!result.success) {
               setErrorNote(result.error);
               return;
            }

            // Il valore salvato dal server viene normalizzato con trim().
            const noteNormalizzate = noteDaSalvare.trim();

            setNoteSalvate(noteNormalizzate);
            setNote((correnti) => (correnti === noteDaSalvare ? noteNormalizzate : correnti));

            setNoteConfermate(true);
         } catch (err) {
            setErrorNote(err instanceof Error ? err.message : "Errore durante il salvataggio delle note.");
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
                  disabled={isPendingStato}
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
                              ${isPendingStato ? "cursor-not-allowed opacity-50" : ""}
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
                     disabled={isPendingStato}
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

               {/* Salvataggio dello stato */}
               {isPendingStato && (
                  <div className="flex items-center gap-2 text-primary">
                     <LoadingSpinner size="sm" label="Salvataggio stato documento" />

                     <span className="text-xs">Salvataggio...</span>
                  </div>
               )}
            </div>
         </div>

         {/* Stato non ancora impostato */}
         {stato === null && !isPendingStato && (
            <p className="mt-3 text-xs italic text-muted-subtle">Stato non ancora impostato</p>
         )}

         {/* Errori dello stato */}
         {errorStato && (
            <p role="alert" className="mt-3 text-xs text-danger">
               {errorStato}
            </p>
         )}

         {/* Note individuali del documento */}
         <div className="mt-4 border-t border-border pt-4">
            <label
               htmlFor={`note-documento-${detenutoId}-${documento.id}`}
               className="mb-2 block text-xs font-medium text-muted-strong"
            >
               Note
            </label>

            <textarea
               id={`note-documento-${detenutoId}-${documento.id}`}
               value={note}
               onChange={(event) => handleNoteChange(event.target.value)}
               rows={2}
               placeholder="Annotazioni sul documento o sullo stato della pratica..."
               className="
                  w-full resize-y rounded-lg
                  border border-border-strong
                  bg-slate-800 px-3 py-2
                  text-sm text-foreground
                  placeholder:text-muted-subtle
                  focus:border-primary
                  focus:outline-none
                  disabled:cursor-not-allowed
                  disabled:opacity-50
               "
               disabled={isPendingNote}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
               <div aria-live="polite" className="text-xs">
                  {isPendingNote ? (
                     <span className="inline-flex items-center gap-2 text-primary">
                        <LoadingSpinner size="sm" label="Salvataggio note documento" />
                        Salvataggio note...
                     </span>
                  ) : errorNote ? (
                     <span role="alert" className="text-danger">
                        {errorNote}
                     </span>
                  ) : noteConfermate && !noteModificate ? (
                     <span className="text-emerald-400">Note salvate correttamente</span>
                  ) : noteModificate ? (
                     <span className="text-muted">Modifiche non salvate</span>
                  ) : (
                     <span className="text-muted-subtle">{noteSalvate ? "Note salvate" : "Nessuna nota inserita"}</span>
                  )}
               </div>

               <button
                  type="button"
                  onClick={handleSalvaNote}
                  disabled={isPendingNote || !noteModificate}
                  className="
                     rounded-lg border border-primary
                     bg-sky-400/10 px-3 py-2
                     text-xs font-medium text-primary
                     transition-colors
                     hover:bg-sky-400/20
                     disabled:cursor-not-allowed
                     disabled:opacity-50
                  "
               >
                  Salva note
               </button>
            </div>
         </div>
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
 * - note specifiche per ciascun documento
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
