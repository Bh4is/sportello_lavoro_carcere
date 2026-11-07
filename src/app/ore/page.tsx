import { Suspense } from "react";
import type { Metadata } from "next";

import PageTitle from "@/src/components/Ui/PageTitle";
import OreTable from "@/src/components/Table/OreTable";

export const metadata: Metadata = {
   title: "Ore - Sportello Lavoro Carcere",
   description: "Riepilogo mensile delle ore di colloquio e back office",
};

export default function OrePage() {
   return (
      <div className="flex h-full min-h-0 flex-col">
         <PageTitle>Riepilogo Ore</PageTitle>

         <div className="min-h-0 flex-1">
            <Suspense
               fallback={
                  <div className="mx-auto mt-4 w-19/20 rounded-xl border border-slate-700 bg-lightbg p-8 text-center text-sm text-slate-400">
                     Caricamento riepilogo ore...
                  </div>
               }>
               <OreTable />
            </Suspense>
         </div>
      </div>
   );
}
