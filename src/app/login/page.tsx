import { Suspense } from "react";

type LoginPageProps = {
   searchParams: Promise<{
      error?: string;
   }>;
};

async function LoginForm({ searchParams }: LoginPageProps) {
   const { error } = await searchParams;

   return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-800 p-8 shadow-xl">
         <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-sky-300">Sportello Lavoro Carcere</h1>

            <p className="mt-3 text-sm text-gray-400">Inserisci la password per accedere all&apos;applicazione.</p>
         </div>

         {(error === "1" || error === "locked") && (
            <div
               role="alert"
               className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
               {error === "locked"
                  ? "Troppi tentativi di accesso. Riprova tra 15 minuti."
                  : "Password non corretta. Riprova."}
            </div>
         )}

         <form action="/api/auth/login" method="POST">
            <div className="mb-6">
               <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-200">
                  Password
               </label>

               <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  autoFocus
                  maxLength={1024}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900 px-4 py-3 text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  placeholder="Inserisci la password"
               />
            </div>

            <button
               type="submit"
               className="w-full rounded-lg bg-sky-400 px-4 py-3 font-semibold text-gray-950 transition hover:bg-sky-300">
               Accedi
            </button>
         </form>

         <p className="mt-8 text-center text-xs text-gray-500">Applicazione ad accesso riservato</p>
      </div>
   );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
   return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
         <Suspense fallback={<div className="text-sm text-gray-400">Caricamento accesso...</div>}>
            <LoginForm searchParams={searchParams} />
         </Suspense>
      </div>
   );
}
