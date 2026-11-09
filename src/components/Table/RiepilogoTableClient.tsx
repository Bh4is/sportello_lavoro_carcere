"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import BaseTable, { type Column } from "@/src/components/Table/BaseTable";

import { formatDurata } from "@/src/lib/utils/format";
import type { DetenutoRow } from "@/src/types/riepilogo";

type Servizio = {
   codice: string;
   tipologia: string;
};

type RiepilogoTableClientProps = {
   codici: Servizio[];
   detenuti: DetenutoRow[];
};

type Ordinamento = "alfabetico" | "data_asc" | "data_desc";

// Normalizza le stringhe per la ricerca
function normalizzaTesto(testo: string): string {
   return testo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("it")
      .trim();
}

// Converte GG/MM/AAAA in un valore ordinabile
function dataOrdinabile(data: string | null): number | null {
   if (!data) return null;

   const [giorno, mese, anno] = data.split("/").map(Number);

   return anno * 10000 + mese * 100 + giorno;
}

export default function RiepilogoTableClient({ codici, detenuti }: RiepilogoTableClientProps) {
   const [ricerca, setRicerca] = useState("");
   const [ordinamento, setOrdinamento] = useState<Ordinamento>("alfabetico");

   // Ricerca e ordinamento in tempo reale
   const detenutiFiltrati = useMemo(() => {
      const testoRicerca = normalizzaTesto(ricerca);

      const risultati = detenuti.filter((detenuto) => normalizzaTesto(detenuto.detenuto).includes(testoRicerca));

      risultati.sort((a, b) => {
         const confrontoAlfabetico = a.detenuto.localeCompare(b.detenuto, "it");

         if (ordinamento === "alfabetico") {
            return confrontoAlfabetico;
         }

         const dataA = dataOrdinabile(a.data_primo_colloquio);
         const dataB = dataOrdinabile(b.data_primo_colloquio);

         // I detenuti senza data vanno sempre in fondo
         if (dataA === null && dataB === null) {
            return confrontoAlfabetico;
         }

         if (dataA === null) return 1;
         if (dataB === null) return -1;

         const confrontoDate = ordinamento === "data_asc" ? dataA - dataB : dataB - dataA;

         return confrontoDate || confrontoAlfabetico;
      });

      return risultati;
   }, [detenuti, ricerca, ordinamento]);

   // Colonne della tabella
   const columns: Column<DetenutoRow>[] = [
      {
         header: "Detenuto",
         sticky: true,
         className: "min-w-56 text-left",

         render: (row) => (
            <div className="flex flex-col gap-1">
               <Link
                  href={`/scheda-individuale/${row.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="
                     w-fit font-semibold text-foreground
                     transition-colors
                     hover:text-primary hover:underline
                     focus-visible:rounded-sm
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-primary
                  "
                  title={`Apri la scheda individuale di ${row.detenuto} in una nuova scheda`}
               >
                  {row.detenuto}
               </Link>

               {row.data_primo_colloquio && (
                  <span className="text-xs font-normal text-muted">
                     Primo colloquio: {row.data_primo_colloquio}
                  </span>
               )}
            </div>
         ),
      },

      ...codici.map(
         (servizio): Column<DetenutoRow> => ({
            header: servizio.codice,
            group: servizio.tipologia,
            className: "min-w-32 text-center",

            render: (row) => {
               const ore = row.servizi[servizio.codice];

               const colloquio = ore?.colloquio ?? 0;
               const backOffice = ore?.backOffice ?? 0;

               return (
                  <div className="flex flex-col items-center gap-1">
                     <div className="flex items-center gap-2">
                        <span className="w-6 text-right text-xs text-muted">C:</span>

                        <span className="font-medium tabular-nums">{formatDurata(colloquio)}</span>
                     </div>

                     <div className="flex items-center gap-2">
                        <span className="w-6 text-right text-xs text-muted">BO:</span>

                        <span className="font-medium tabular-nums">{formatDurata(backOffice)}</span>
                     </div>
                  </div>
               );
            },
         }),
      ),
   ];

   return (
      <div className="flex h-full min-h-0 flex-col">
         {/* Barra dei filtri */}
         <div className="mx-auto mt-4 flex w-19/20 flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted">
               {detenutiFiltrati.length} {detenutiFiltrati.length === 1 ? "detenuto" : "detenuti"}
               {ricerca.trim() && " trovati"}
            </span>

            <div className="flex flex-wrap items-center gap-3">
               {/* Ricerca */}
               <div className="relative">
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     width="18"
                     height="18"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     aria-hidden="true"
                     className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                  >
                     <circle cx="11" cy="11" r="8" />
                     <path d="m21 21-4.35-4.35" />
                  </svg>

                  <input
                     type="search"
                     aria-label="Cerca detenuto"
                     value={ricerca}
                     onChange={(e) => setRicerca(e.target.value)}
                     placeholder="Cerca detenuto..."
                     className="
                        w-64 rounded-lg
                        border border-border-strong
                        bg-lightbg
                        py-2 pr-3 pl-10
                        text-sm text-foreground
                        placeholder:text-muted
                        outline-none
                        transition-colors
                        focus:border-primary
                     "
                  />
               </div>

               {/* Ordinamento */}
               <select
                  aria-label="Ordina detenuti"
                  value={ordinamento}
                  onChange={(e) => setOrdinamento(e.target.value as Ordinamento)}
                  className="
                     min-w-52 cursor-pointer rounded-lg
                     border border-border-strong
                     bg-lightbg
                     px-3 py-2
                     text-sm text-foreground
                     outline-none
                     transition-colors
                     focus:border-primary
                  "
               >
                  <option value="alfabetico">Alfabetico (A-Z)</option>

                  <option value="data_asc">Primo colloquio (meno recente)</option>

                  <option value="data_desc">Primo colloquio (più recente)</option>
               </select>
            </div>
         </div>

         {/* Tabella */}
         <div className="min-h-0 flex-1">
            <BaseTable
               columns={columns}
               rows={detenutiFiltrati}
               getRowKey={(row) => row.id}
               compact={false}
               fullWidth={true}
               fillHeight={true}
               emptyMessage={ricerca.trim() ? "Nessun detenuto corrisponde alla ricerca" : "Nessun detenuto registrato"}
            />
         </div>
      </div>
   );
}
