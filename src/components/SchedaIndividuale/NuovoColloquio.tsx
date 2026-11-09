"use client";

import { useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";

import { creaColloquio, type RendicontazioneColloquio } from "@/src/lib/actions/colloqui";

import type { CodiceServizioColloquio } from "@/src/lib/queries/colloquiDetenuti";

type NuovoColloquioProps = {
   detenutoId: number;
   codici: CodiceServizioColloquio[];
};

/**
 * Restituisce la data locale in formato YYYY-MM-DD.
 */
function getTodayLocal(): string {
   const today = new Date();

   const year = today.getFullYear();
   const month = String(today.getMonth() + 1).padStart(2, "0");
   const day = String(today.getDate()).padStart(2, "0");

   return `${year}-${month}-${day}`;
}

/**
 * Converte una durata HH:MM in minuti interi.
 *
 * Esempi:
 * 00:15 -> 15 minuti
 * 00:30 -> 30 minuti
 * 01:30 -> 90 minuti
 * 02:45 -> 165 minuti
 *
 * Non utilizza ore decimali.
 * I minuti devono essere compresi tra 00 e 59.
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
 * Modulo per registrare un nuovo colloquio.
 *
 * Permette di inserire:
 * - data del colloquio
 * - tipologia di servizio
 * - durata colloquio (HH:MM)
 * - durata back office (HH:MM)
 * - resoconto
 *
 * I codici di servizio provengono da MariaDB.
 * Le durate vengono conservate in minuti interi.
 */
export default function NuovoColloquio({ detenutoId, codici }: NuovoColloquioProps) {
   const [isOpen, setIsOpen] = useState(false);

   const [dataColloquio, setDataColloquio] = useState("");
   const [codiceServizio, setCodiceServizio] = useState("");

   const [oreColloquio, setOreColloquio] = useState("00:00");
   const [oreBackOffice, setOreBackOffice] = useState("00:00");

   const [contenuto, setContenuto] = useState("");
   const [error, setError] = useState<string | null>(null);

   const [isPending, startTransition] = useTransition();

   /**
    * Ripristina tutti i campi del modulo.
    */
   function resetForm() {
      setDataColloquio("");
      setCodiceServizio("");
      setOreColloquio("00:00");
      setOreBackOffice("00:00");
      setContenuto("");
      setError(null);
   }

   function handleOpen() {
      resetForm();
      setDataColloquio(getTodayLocal());
      setIsOpen(true);
   }

   function handleCancel() {
      if (isPending) {
         return;
      }

      setIsOpen(false);
      resetForm();
   }

   /**
    * Valida i dati e richiama la Server Action.
    */
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

      const dataDaSalvare = dataColloquio;
      const contenutoDaSalvare = contenuto.trim();

      setError(null);

      startTransition(async () => {
         try {
            const result = await creaColloquio(detenutoId, dataDaSalvare, contenutoDaSalvare, rendicontazione);

            if (!result.success) {
               setError(result.error);
               return;
            }

            setIsOpen(false);
            resetForm();
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
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
      <div className="w-full">
         {!isOpen ? (
            <button
               type="button"
               onClick={handleOpen}
               className="
                  rounded-lg border border-primary-border
                  bg-primary-soft px-4 py-2.5
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
                  sm:p-6
               "
            >
               <h3 className="mb-6 text-base font-semibold text-primary">Registra nuovo colloquio</h3>

               {/* Data e tipologia */}
               <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                     <label htmlFor="nuovo-colloquio-data" className={labelClassName}>
                        Data del colloquio
                     </label>

                     <input
                        id="nuovo-colloquio-data"
                        type="date"
                        value={dataColloquio}
                        onChange={(event) => setDataColloquio(event.target.value)}
                        disabled={isPending}
                        required
                        className={inputClassName}
                     />
                  </div>

                  <div>
                     <label htmlFor="nuovo-colloquio-tipologia" className={labelClassName}>
                        Tipologia di servizio
                     </label>

                     <select
                        id="nuovo-colloquio-tipologia"
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

                     {codici.length === 0 && (
                        <p className="mt-2 text-xs text-danger">Nessun codice di servizio disponibile.</p>
                     )}
                  </div>
               </div>

               {/* Rendicontazione ore */}
               <div className="mb-6 rounded-lg border border-border bg-surface-input/30 p-4">
                  <h4 className="mb-4 text-sm font-semibold text-foreground">Rendicontazione ore</h4>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                     <div>
                        <label htmlFor="nuovo-colloquio-ore" className={labelClassName}>
                           Ore colloquio (HH:MM)
                        </label>

                        <input
                           id="nuovo-colloquio-ore"
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
                        <label htmlFor="nuovo-colloquio-backoffice" className={labelClassName}>
                           Ore back office (HH:MM)
                        </label>

                        <input
                           id="nuovo-colloquio-backoffice"
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
                     Inserisci la durata nel formato HH:MM. Ad esempio: 01:30 = 1 ora e 30 minuti. Utilizza 00:00 quando
                     non ci sono ore da registrare.
                  </p>
               </div>

               {/* Resoconto */}
               <div className="mb-5">
                  <label htmlFor="nuovo-colloquio-contenuto" className={labelClassName}>
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

               {/* Messaggi di errore */}
               {error && (
                  <p role="alert" className="mb-4 text-sm text-danger">
                     {error}
                  </p>
               )}

               {/* Pulsanti */}
               <div className="flex flex-wrap justify-end gap-3">
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
