import type { CSSProperties } from "react";

type LoadingSpinnerProps = {
   size?: "sm" | "md" | "lg";
   className?: string;
   label?: string;
};

/**
 * Spinner di caricamento riutilizzabile.
 *
 * Utilizza le animazioni di Tailwind CSS.
 * Il colore viene ereditato dal componente padre.
 */
export default function LoadingSpinner({
   size = "sm",
   className = "",
   label = "Caricamento in corso",
}: LoadingSpinnerProps) {
   const sizes = {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-9 w-9 border-[3px]",
   };

   const style: CSSProperties = {
      animationDuration: "750ms",
   };

   return (
      <span
         role="status"
         aria-label={label}
         className={`inline-flex shrink-0 items-center justify-center ${className}`}
      >
         <span
            aria-hidden="true"
            style={style}
            className={`
               inline-block rounded-full
               border-current border-r-transparent
               animate-spin motion-reduce:animate-none
               ${sizes[size]}
            `}
         />
      </span>
   );
}
