import { Suspense } from "react";

import PageTitle from "@/src/components/Ui/PageTitle";
import RiepilogoTable from "@/src/components/Table/RiepilogoTable";

export default function Homepage() {
   return (
      <>
         <title>Sportello Lavoro Carcere</title>

         <div className="flex h-full min-h-0 flex-col">
            <PageTitle>Sportello Lavoro Carcere</PageTitle>

            <div className="min-h-0 flex-1">
               <Suspense
                  fallback={
                     <div className="mx-auto mt-4 w-19/20 rounded-xl border border-slate-700 bg-lightbg p-8 text-center text-sm text-slate-400">
                        Caricamento riepilogo...
                     </div>
                  }>
                  <RiepilogoTable />
               </Suspense>
            </div>
         </div>
      </>
   );
}
