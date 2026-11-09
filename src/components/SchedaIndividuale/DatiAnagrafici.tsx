"use client";

import EditableField from "@/src/components/SchedaIndividuale/EditableField";

import { aggiornaCampoDetenuto } from "@/src/lib/actions/detenuti";

import type { Detenuto } from "@/src/lib/queries/detenuti";

type DatiAnagraficiProps = {
   detenuto: Detenuto;
};

type CampoAnagrafico = "nome" | "cognome" | "data_nascita" | "data_primo_colloquio" | "note";

/**
 * Componente per la visualizzazione e la modifica
 * dei dati anagrafici di un singolo detenuto.
 *
 * Le modifiche vengono salvate tramite Server Actions,
 * senza utilizzare Route Handlers o chiamate fetch.
 */
export default function DatiAnagrafici({ detenuto }: DatiAnagraficiProps) {
   /**
    * Aggiorna un singolo campo tramite Server Action.
    *
    * La Server Action si occupa di:
    * - verificare la sessione;
    * - validare il valore;
    * - aggiornare MariaDB;
    * - aggiornare i dati visualizzati.
    */
   async function salvaCampo(field: CampoAnagrafico, value: string | null): Promise<void> {
      const result = await aggiornaCampoDetenuto(detenuto.id, field, value);

      if (!result.success) {
         throw new Error(result.error);
      }
   }

   return (
      <div className="w-full">
         <h2 className="mb-6 text-lg font-semibold text-primary">Dati anagrafici</h2>

         <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EditableField
               label="Nome"
               value={detenuto.nome}
               maxLength={100}
               onSave={(value) => salvaCampo("nome", value)}
            />

            <EditableField
               label="Cognome"
               value={detenuto.cognome}
               maxLength={100}
               onSave={(value) => salvaCampo("cognome", value)}
            />

            <EditableField
               label="Data di nascita"
               type="date"
               value={detenuto.data_nascita}
               onSave={(value) => salvaCampo("data_nascita", value)}
            />

            <EditableField
               label="Data primo colloquio"
               type="date"
               value={detenuto.data_primo_colloquio}
               onSave={(value) => salvaCampo("data_primo_colloquio", value)}
            />

            <div className="md:col-span-2">
               <EditableField
                  label="Note"
                  type="textarea"
                  value={detenuto.note}
                  placeholder="Nessuna nota presente"
                  onSave={(value) => salvaCampo("note", value)}
               />
            </div>
         </div>
      </div>
   );
}
