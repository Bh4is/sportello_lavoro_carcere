"use client";

import { useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";

import { modificaColloquio, eliminaColloquio, type RendicontazioneColloquio } from "@/src/lib/actions/colloqui";

import type { ColloquioDetenuto, CodiceServizioColloquio } from "@/src/lib/queries/colloquiDetenuti";

type ColloquioItemProps = {
   detenutoId: number;
   colloquio: ColloquioDetenuto;
   codici?: CodiceServizioColloquio[];
};

type Operazione = "modifica" | "elimina" | null;

/**
 * Formatta YYYY-MM-DD in DD/MM/YYYY.
 */
function formatDate(value: string): string {
   const [year, month, day] = value.split("-");

   if (!year || !month || !day) {
      return value;
   }

   return `${day}/${month}/${year}`;
}

/**
 * Converte i minuti salvati su MariaDB
 * nel formato HH:MM utilizzato dall'interfaccia.
 *
 * Esempi:
 * 0   -> 00:00
 * 30  -> 00:30
 * 90  -> 01:30
 * 165 -> 02:45
 */
function minutiInOre(minuti: number): string {
   const ore = Math.floor(minuti / 60);
   const restanti = minuti % 60;

   return `${String(ore).padStart(2, "0")}:` + `${String(restanti).padStart(2, "0")}`;
}

/**
 * Converte una durata HH:MM in minuti interi.
 *
 * Non utilizza ore decimali.
 * I minuti devono essere compresi tra 00 e 59.
 *
 * Restituisce null se il formato non è valido.
 */
function oreInMinuti(value: string): number | null {
   const match = /^(\d+):([0-5]\d)$/.exec(value.trim());

   if (!match) {
      return null;
   }

   const ore = Number(match[1]);
   const minuti = Number(match[2]);

   const totale = ore * 60 + minuti;

   if (!Number.isSafeInteger(totale) || totale > 4294967295) {
      return null;
   }

   return totale;
}

/**
 * Visualizza, modifica ed elimina un colloquio.
 *
 * Le durate sono sempre presentate in HH:MM,
 * mentre MariaDB le conserva in minuti interi.
 */
export default function ColloquioItem({ detenutoId, colloquio, codici = [] }: ColloquioItemProps) {
   const [isEditing, setIsEditing] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);

   const [dataColloquio, setDataColloquio] = useState(colloquio.data_colloquio);

   const [codiceServizio, setCodiceServizio] = useState(colloquio.codice_servizio ?? "");

   const [oreColloquio, setOreColloquio] = useState(minutiInOre(colloquio.minuti_colloquio));

   const [oreBackOffice, setOreBackOffice] = useState(minutiInOre(colloquio.minuti_back_office));

   const [contenuto, setContenuto] = useState(colloquio.contenuto);

   const [error, setError] = useState<string | null>(null);
   const [operazione, setOperazione] = useState<Operazione>(null);

   const [isPending, startTransition] = useTransition();

   /**
    * Ripristina i valori attualmente salvati.
    */
   function resetFields() {
      setDataColloquio(colloquio.data_colloquio);
      setCodiceServizio(colloquio.codice_servizio ?? "");

      setOreColloquio(minutiInOre(colloquio.minuti_colloquio));

      setOreBackOffice(minutiInOre(colloquio.minuti_back_office));

      setContenuto(colloquio.contenuto);
      setError(null);
   }

   function handleEdit() {
      if (isPending) return;

      resetFields();
      setIsDeleting(false);
      setIsEditing(true);
   }

   function handleCancelEdit() {
      if (isPending) return;

      resetFields();
      setIsEditing(false);
   }

   /**
    * Salva le modifiche tramite Server Action.
    *
    * Colloquio e attività vengono aggiornati
    * all'interno della stessa transazione MariaDB.
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

      const minutiColloquio = oreInMinuti(oreColloquio);
      const minutiBackOffice = oreInMinuti(oreBackOffice);

      if (minutiColloquio === null) {
         setError("Inserisci le ore di colloquio nel formato HH:MM, ad esempio 01:30.");
         return;
      }

      if (minutiBackOffice === null) {
         setError("Inserisci le ore di back office nel formato HH:MM, ad esempio 00:30.");
         return;
      }

      if ((minutiColloquio > 0 || minutiBackOffice > 0) && !codiceServizio) {
         setError("Seleziona una tipologia di servizio per registrare le ore.");
         return;
      }

      if (codiceServizio && !codici.some((item) => item.codice === codiceServizio)) {
         setError("La tipologia selezionata non è disponibile.");
         return;
      }

      const rendicontazione: RendicontazioneColloquio = {
         codiceServizio: codiceServizio || null,
         minutiColloquio,
         minutiBackOffice,
      };

      const nuovaData = dataColloquio;
      const nuovoContenuto = contenuto.trim();

      setError(null);
      setOperazione("modifica");

      startTransition(async () => {
         try {
            const result = await modificaColloquio(
               detenutoId,
               colloquio.id,
               nuovaData,
               nuovoContenuto,
               rendicontazione,
            );

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
    * Elimina il colloquio e le attività
    * di rendicontazione ad esso associate.
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

   const inputClassName = `
      w-full rounded-lg
      border border-border-strong
      bg-surface-input
      px-3 py-2.5
      text-sm text-foreground
      outline-none
      focus:border-primary-hover
      focus:ring-1 focus:ring-primary-hover/30
      disabled:opacity-50
   `;

   const labelClassName = "mb-2 block text-xs font-medium text-muted";

   return (
      <article className="overflow-hidden rounded-xl border border-border bg-slate-900/40">
         {/* Intestazione */}
         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex flex-wrap items-center gap-3">
               <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />

               <h3 className="text-sm font-semibold text-primary">
                  Colloquio del {formatDate(colloquio.data_colloquio)}
               </h3>

               {colloquio.codice_servizio && (
                  <span className="rounded-md border border-primary-border bg-primary-soft px-2 py-1 text-xs font-medium text-primary">
                     {colloquio.codice_servizio}
                  </span>
               )}
            </div>

            {!isEditing && !isDeleting && (
               <div className="flex items-center gap-2">
                  <button
                     type="button"
                     onClick={handleEdit}
                     disabled={isPending}
                     className="rounded-lg border border-primary-border px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
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
                     className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-medium text-danger transition-colors hover:bg-red-400/10 disabled:opacity-50"
                  >
                     Elimina
                  </button>
               </div>
            )}
         </div>

         <div className="px-5 py-5">
            {/* Visualizzazione normale */}
            {!isEditing && !isDeleting && (
               <div className="space-y-5">
                  {colloquio.nome_servizio && <p className="text-xs text-muted">{colloquio.nome_servizio}</p>}

                  {colloquio.codice_servizio && (
                     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border bg-surface-input p-3">
                           <p className="text-xs text-muted">Ore colloquio</p>

                           <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                              {minutiInOre(colloquio.minuti_colloquio)}
                           </p>
                        </div>

                        <div className="rounded-lg border border-border bg-surface-input p-3">
                           <p className="text-xs text-muted">Ore back office</p>

                           <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                              {minutiInOre(colloquio.minuti_back_office)}
                           </p>
                        </div>
                     </div>
                  )}

                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-text-on-surface">
                     {colloquio.contenuto}
                  </p>
               </div>
            )}

            {/* Modifica colloquio */}
            {isEditing && (
               <div className="space-y-5">
                  {/* Data e tipologia */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                     <div>
                        <label htmlFor={`colloquio-data-${colloquio.id}`} className={labelClassName}>
                           Data del colloquio
                        </label>

                        <input
                           id={`colloquio-data-${colloquio.id}`}
                           type="date"
                           value={dataColloquio}
                           onChange={(event) => setDataColloquio(event.target.value)}
                           disabled={isPending}
                           className={inputClassName}
                        />
                     </div>

                     <div>
                        <label htmlFor={`colloquio-codice-${colloquio.id}`} className={labelClassName}>
                           Tipologia di servizio
                        </label>

                        <select
                           id={`colloquio-codice-${colloquio.id}`}
                           value={codiceServizio}
                           onChange={(event) => setCodiceServizio(event.target.value)}
                           disabled={isPending || codici.length === 0}
                           className={inputClassName}
                        >
                           <option value="">Seleziona una tipologia...</option>

                           {codici.map((item) => (
                              <option key={item.codice} value={item.codice}>
                                 {item.codice} - {item.nome}
                              </option>
                           ))}
                        </select>
                     </div>
                  </div>

                  {/* Rendicontazione ore */}
                  <div className="rounded-lg border border-border bg-surface-input/30 p-4">
                     <h4 className="mb-4 text-sm font-semibold text-foreground">Rendicontazione ore</h4>

                     <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                           <label htmlFor={`colloquio-ore-${colloquio.id}`} className={labelClassName}>
                              Ore colloquio (HH:MM)
                           </label>

                           <input
                              id={`colloquio-ore-${colloquio.id}`}
                              type="text"
                              inputMode="numeric"
                              value={oreColloquio}
                              onChange={(event) => setOreColloquio(event.target.value)}
                              disabled={isPending}
                              placeholder="00:00"
                              maxLength={8}
                              className={inputClassName}
                           />
                        </div>

                        <div>
                           <label htmlFor={`colloquio-backoffice-${colloquio.id}`} className={labelClassName}>
                              Ore back office (HH:MM)
                           </label>

                           <input
                              id={`colloquio-backoffice-${colloquio.id}`}
                              type="text"
                              inputMode="numeric"
                              value={oreBackOffice}
                              onChange={(event) => setOreBackOffice(event.target.value)}
                              disabled={isPending}
                              placeholder="00:00"
                              maxLength={8}
                              className={inputClassName}
                           />
                        </div>
                     </div>

                     <p className="mt-3 text-xs text-muted-subtle">
                        Inserisci la durata nel formato HH:MM. Ad esempio: 01:30 = 1 ora e 30 minuti. Utilizza 00:00
                        quando non ci sono ore da registrare.
                     </p>
                  </div>

                  {/* Resoconto */}
                  <div>
                     <label htmlFor={`colloquio-contenuto-${colloquio.id}`} className={labelClassName}>
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
                           focus:ring-1 focus:ring-primary-hover/30
                           disabled:opacity-50
                        "
                     />
                  </div>

                  {/* Pulsanti modifica */}
                  <div className="flex flex-wrap justify-end gap-2">
                     <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                        className="rounded-lg border border-border-strong px-4 py-2 text-sm text-muted-strong hover:bg-surface-raised disabled:opacity-50"
                     >
                        Annulla
                     </button>

                     <button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending}
                        className="inline-flex min-w-40 items-center justify-center gap-2 rounded-lg border border-primary-border bg-primary-soft px-4 py-2 text-sm font-medium text-primary hover:bg-primary-hover/20 disabled:opacity-50"
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
                     Verranno eliminati definitivamente il resoconto e le ore di rendicontazione associate. Questa
                     operazione non può essere annullata.
                  </p>

                  <div className="flex flex-wrap justify-end gap-2">
                     <button
                        type="button"
                        onClick={() => {
                           if (isPending) return;

                           setIsDeleting(false);
                           setError(null);
                        }}
                        disabled={isPending}
                        className="rounded-lg border border-border-strong px-4 py-2 text-sm text-muted-strong hover:bg-surface-raised disabled:opacity-50"
                     >
                        Annulla
                     </button>

                     <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="inline-flex min-w-44 items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-400/20 disabled:opacity-50"
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
