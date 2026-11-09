import type { Metadata } from "next";

import PageTitle from "@/src/components/Ui/PageTitle";
import AnagraficaForm from "@/src/components/InserisciAnagrafica/AnagraficaForm";

export const metadata: Metadata = {
   title: "Inserisci Anagrafica - Sportello Lavoro Carcere",
   description: "Inserimento di una nuova anagrafica detenuto",
};

/**
 * Pagina per l'inserimento di una nuova anagrafica.
 *
 * Il modulo client richiama una Server Action
 * che valida i dati e li salva su MariaDB.
 */
export default function Inserisci() {
   return (
      <div className="flex h-full min-h-0 flex-col">
         <PageTitle>Inserisci Anagrafica</PageTitle>

         <div className="mx-auto mt-4 w-[95%] max-w-6xl pb-8">
            <AnagraficaForm />
         </div>
      </div>
   );
}
