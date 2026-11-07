import Image from "next/image";
import NavLink from "@/src/components/Navbar/NavLink";

export default function Navbar() {
   return (
      <div className="flex w-full justify-center items-center gap-3 border-b border-foreground p-2 bg-primary/20">
         <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold">SLC</h1>
         </div>

         <div className="flex gap-5 text-lg">
            <NavLink href="/">Riassuntivo</NavLink>
            <NavLink href="/colloqui">Colloqui</NavLink>
            <NavLink href="/ore">Riepilogo Ore</NavLink>
         </div>
      </div>
   );
}
