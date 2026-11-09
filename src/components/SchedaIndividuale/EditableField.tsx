"use client";

import { useEffect, useState, useTransition } from "react";

import LoadingSpinner from "@/src/components/Ui/LoadingSpinner";

export type EditableFieldType = "text" | "date" | "textarea";

type EditableFieldProps = {
   label: string;
   value: string | null;
   type?: EditableFieldType;
   placeholder?: string;
   maxLength?: number;
   onSave: (value: string | null) => Promise<void>;
};

/**
 * Campo modificabile singolarmente.
 *
 * Utilizza useTransition per gestire lo stato
 * di caricamento durante il salvataggio.
 */
export default function EditableField({
   label,
   value,
   type = "text",
   placeholder = "Non specificato",
   maxLength,
   onSave,
}: EditableFieldProps) {
   const [currentValue, setCurrentValue] = useState(value ?? "");
   const [draftValue, setDraftValue] = useState(value ?? "");

   const [isEditing, setIsEditing] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [isPending, startTransition] = useTransition();

   /**
    * Sincronizza il valore ricevuto dal server,
    * senza sovrascrivere una modifica in corso.
    */
   useEffect(() => {
      if (!isEditing && !isPending) {
         setCurrentValue(value ?? "");
         setDraftValue(value ?? "");
      }
   }, [value, isEditing, isPending]);

   function handleEdit() {
      setDraftValue(currentValue);
      setError(null);
      setIsEditing(true);
   }

   function handleCancel() {
      if (isPending) return;

      setDraftValue(currentValue);
      setError(null);
      setIsEditing(false);
   }

   function handleSave() {
      if (isPending) return;

      if (draftValue === currentValue) {
         setIsEditing(false);
         return;
      }

      const newValue = draftValue;

      setError(null);

      startTransition(async () => {
         try {
            await onSave(newValue === "" ? null : newValue);

            setCurrentValue(newValue);
            setIsEditing(false);
         } catch (err) {
            setError(err instanceof Error ? err.message : "Errore durante il salvataggio.");
         }
      });
   }

   const inputClassName = `
      w-full rounded-lg
      border px-3 py-2.5
      text-sm outline-none
      transition-colors
      ${
         isEditing
            ? "border-primary-hover bg-surface-input text-foreground focus:ring-1 focus:ring-primary-hover/30"
            : "border-border bg-slate-900/40 text-muted-strong"
      }
   `;

   return (
      <div className="w-full">
         <label className="mb-2 block text-xs font-medium text-muted">{label}</label>

         <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
               {type === "textarea" ? (
                  <textarea
                     aria-label={label}
                     value={isEditing ? draftValue : currentValue}
                     onChange={(event) => setDraftValue(event.target.value)}
                     disabled={!isEditing || isPending}
                     placeholder={placeholder}
                     maxLength={maxLength}
                     rows={5}
                     className={`${inputClassName} min-h-32 resize-y disabled:cursor-default`}
                  />
               ) : (
                  <input
                     aria-label={label}
                     type={type}
                     value={isEditing ? draftValue : currentValue}
                     onChange={(event) => setDraftValue(event.target.value)}
                     disabled={!isEditing || isPending}
                     placeholder={placeholder}
                     maxLength={maxLength}
                     className={`${inputClassName} disabled:cursor-default`}
                  />
               )}
            </div>

            {!isEditing && (
               <button
                  type="button"
                  onClick={handleEdit}
                  className="
                     shrink-0 rounded-lg
                     border border-primary-border
                     px-3 py-2.5
                     text-xs font-medium text-primary
                     transition-colors
                     hover:bg-primary-soft
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-sky-400
                  "
               >
                  Modifica
               </button>
            )}
         </div>

         {isEditing && (
            <div className="mt-2 flex justify-end gap-2">
               <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isPending}
                  className="
                     rounded-lg border border-border-strong
                     px-3 py-2
                     text-xs text-muted-strong
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
                     inline-flex min-w-24 items-center
                     justify-center gap-2
                     rounded-lg border border-primary-border
                     bg-primary-soft
                     px-3 py-2
                     text-xs font-medium text-primary
                     transition-colors
                     hover:bg-primary-hover/20
                     disabled:cursor-not-allowed
                     disabled:opacity-50
                  "
               >
                  {isPending ? (
                     <>
                        <LoadingSpinner size="sm" label="Salvataggio in corso" />
                        Salvataggio...
                     </>
                  ) : (
                     "Salva"
                  )}
               </button>
            </div>
         )}

         {error && (
            <p role="alert" className="mt-2 text-xs text-danger">
               {error}
            </p>
         )}
      </div>
   );
}
