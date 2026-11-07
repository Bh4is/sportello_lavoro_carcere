"use client";

import { usePathname } from "next/navigation";
import NavLink from "@/src/components/Navbar/NavLink";

export default function Navbar() {
   const pathname = usePathname();

   // Non mostrare la Navbar nella pagina di login.
   if (pathname === "/login") {
      return null;
   }

   return (
      <nav className="flex w-full items-center justify-center gap-6 border-b border-foreground bg-primary/20 p-2">
         <h1 className="text-3xl font-semibold">SLC</h1>

         <div className="flex items-center gap-5 text-lg">
            <NavLink href="/">Riassuntivo</NavLink>
            <NavLink href="/colloqui">Colloqui</NavLink>
            <NavLink href="/ore">Riepilogo Ore</NavLink>
         </div>

         <form action="/api/auth/logout" method="POST">
            <button
               type="submit"
               className="rounded-lg border border-sky-400/40 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-400/10">
               Esci
            </button>
         </form>
      </nav>
   );
}
