"use client";

import { useState, type ReactNode } from "react";

export type SchedaTabId = "anagrafica" | "colloqui" | "documenti";

type SchedaTab = {
   id: SchedaTabId;
   label: string;
};

type SchedaTabsProps = {
   anagrafica: ReactNode;
   colloqui: ReactNode;
   documenti: ReactNode;
};

const tabs: SchedaTab[] = [
   {
      id: "anagrafica",
      label: "Dati anagrafici",
   },
   {
      id: "colloqui",
      label: "Colloqui",
   },
   {
      id: "documenti",
      label: "Checklist documenti",
   },
];

/**
 * Componente per la navigazione tra le sezioni
 * della Scheda Individuale.
 *
 * Mantiene nello stato React la tab selezionata,
 * senza modificare l'URL o ricaricare la pagina.
 */
export default function SchedaTabs({ anagrafica, colloqui, documenti }: SchedaTabsProps) {
   const [activeTab, setActiveTab] = useState<SchedaTabId>("anagrafica");

   const contenuti: Record<SchedaTabId, ReactNode> = {
      anagrafica,
      colloqui,
      documenti,
   };

   return (
      <div className="mt-6 w-full">
         {/* Navigazione delle tab */}
         <div
            role="tablist"
            aria-label="Sezioni della scheda individuale"
            className="
               flex flex-wrap gap-2
               border-b border-border
            "
         >
            {tabs.map((tab) => {
               const isActive = activeTab === tab.id;

               return (
                  <button
                     key={tab.id}
                     type="button"
                     role="tab"
                     id={`scheda-tab-${tab.id}`}
                     aria-selected={isActive}
                     aria-controls={`scheda-panel-${tab.id}`}
                     onClick={() => setActiveTab(tab.id)}
                     className={`
                        cursor-pointer
                        border-b-2 px-5 py-3
                        text-sm font-medium
                        transition-colors
                        focus-visible:rounded-t-lg
                        focus-visible:outline-2
                        focus-visible:outline-offset-2
                        focus-visible:outline-sky-400
                        ${
                           isActive
                              ? "border-primary-hover text-primary"
                              : "border-transparent text-muted hover:border-border-strong hover:text-text-on-surface"
                        }
                     `}
                  >
                     {tab.label}
                  </button>
               );
            })}
         </div>

         {/* Contenuto della tab selezionata */}
         <div
            id={`scheda-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`scheda-tab-${activeTab}`}
            tabIndex={0}
            className="
               mt-5 rounded-xl
               border border-border
               bg-lightbg p-6
               shadow-sm
               focus-visible:outline-2
               focus-visible:outline-offset-2
               focus-visible:outline-sky-400
            "
         >
            {contenuti[activeTab]}
         </div>
      </div>
   );
}
