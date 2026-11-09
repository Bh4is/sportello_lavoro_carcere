"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { DetenutoSearchItem } from "@/src/lib/queries/detenuti";

type DetenutoSearchProps = {
   detenuti: DetenutoSearchItem[];
};

function normalizeText(value: string): string {
   return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("it")
      .trim();
}

export default function DetenutoSearch({ detenuti }: DetenutoSearchProps) {
   const router = useRouter();

   const [query, setQuery] = useState("");
   const [isOpen, setIsOpen] = useState(false);
   const [activeIndex, setActiveIndex] = useState(-1);

   const containerRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
   const listId = useId();

   const risultati = useMemo(() => {
      const ricerca = normalizeText(query);

      if (!ricerca) {
         return [];
      }

      const termini = ricerca.split(/\s+/);

      return detenuti
         .filter((detenuto) => {
            const nominativo = normalizeText(`${detenuto.nome} ${detenuto.cognome}`);

            const nominativoInverso = normalizeText(`${detenuto.cognome} ${detenuto.nome}`);

            return termini.every((termine) => nominativo.includes(termine) || nominativoInverso.includes(termine));
         })
         .slice(0, 10);
   }, [detenuti, query]);

   useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
            setActiveIndex(-1);
         }
      }

      document.addEventListener("mousedown", handleClickOutside);

      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, []);

   function selezionaDetenuto(detenuto: DetenutoSearchItem) {
      setQuery(`${detenuto.nome} ${detenuto.cognome}`.trim());
      setIsOpen(false);
      setActiveIndex(-1);

      router.push(`/scheda-individuale/${detenuto.id}`);
   }

   function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      if (event.key === "Escape") {
         setIsOpen(false);
         setActiveIndex(-1);
         return;
      }

      if (!isOpen || risultati.length === 0) {
         return;
      }

      if (event.key === "ArrowDown") {
         event.preventDefault();

         setActiveIndex((current) => (current < risultati.length - 1 ? current + 1 : 0));
      }

      if (event.key === "ArrowUp") {
         event.preventDefault();

         setActiveIndex((current) => (current > 0 ? current - 1 : risultati.length - 1));
      }

      if (event.key === "Enter" && activeIndex >= 0) {
         event.preventDefault();
         selezionaDetenuto(risultati[activeIndex]);
      }
   }

   return (
      <div ref={containerRef} className="relative w-full">
         <label htmlFor={listId} className="mb-2 block text-sm font-medium text-muted-strong">
            Cerca detenuto
         </label>

         <div className="relative">
            <input
               ref={inputRef}
               id={listId}
               type="search"
               role="combobox"
               aria-autocomplete="list"
               aria-expanded={isOpen && risultati.length > 0}
               aria-controls={`${listId}-results`}
               aria-activedescendant={activeIndex >= 0 && isOpen ? `${listId}-option-${activeIndex}` : undefined}
               autoComplete="off"
               value={query}
               onChange={(event) => {
                  setQuery(event.target.value);
                  setIsOpen(true);
                  setActiveIndex(-1);
               }}
               onFocus={() => {
                  if (query.trim()) {
                     setIsOpen(true);
                  }
               }}
               onKeyDown={handleKeyDown}
               placeholder="Cerca per nome o cognome..."
               className="
                  w-full rounded-lg
                  border border-border-strong
                  bg-surface-input
                  px-4 py-3 pr-10
                  text-sm text-foreground
                  placeholder:text-muted-subtle
                  outline-none
                  transition-colors
                  focus:border-primary-hover
                  focus:ring-1 focus:ring-primary-hover/30
               "
            />

            <svg
               xmlns="http://www.w3.org/2000/svg"
               width="20"
               height="20"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
               strokeLinejoin="round"
               aria-hidden="true"
               className="
                  pointer-events-none
                  absolute right-3 top-1/2
                  -translate-y-1/2
                  text-muted
               "
            >
               <circle cx="11" cy="11" r="8" />
               <path d="m21 21-4.35-4.35" />
            </svg>
         </div>

         {isOpen && query.trim() && (
            <div
               className="
                  absolute left-0 right-0 top-full z-50 mt-2
                  overflow-hidden rounded-lg
                  border border-border-strong
                  bg-slate-800 shadow-xl
               "
            >
               {risultati.length > 0 ? (
                  <ul
                     id={`${listId}-results`}
                     role="listbox"
                     aria-label="Risultati ricerca detenuti"
                     className="max-h-72 overflow-y-auto py-1"
                  >
                     {risultati.map((detenuto, index) => (
                        <li
                           key={detenuto.id}
                           id={`${listId}-option-${index}`}
                           role="option"
                           aria-selected={activeIndex === index}
                        >
                           <button
                              type="button"
                              tabIndex={-1}
                              onMouseDown={(event) => event.preventDefault()}
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => selezionaDetenuto(detenuto)}
                              className={`
                                 w-full px-4 py-3
                                 text-left text-sm
                                 transition-colors
                                 ${
                                    activeIndex === index
                                       ? "bg-sky-400/15 text-primary"
                                       : "text-text-on-surface hover:bg-surface-raised"
                                 }
                              `}
                           >
                              {detenuto.nome} {detenuto.cognome}
                           </button>
                        </li>
                     ))}
                  </ul>
               ) : (
                  <p role="status" className="px-4 py-4 text-sm text-muted">
                     Nessun detenuto trovato.
                  </p>
               )}
            </div>
         )}
      </div>
   );
}
