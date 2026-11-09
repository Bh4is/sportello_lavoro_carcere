
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Variabili già utilizzate dall'applicazione Next.js.
const {
   DB_HOST,
   DB_PORT = "3306",
   DB_USER,
   DB_PASSWORD,
   DB_NAME,
} = process.env;

// Controlliamo la configurazione senza mostrare password.
const required = {
   DB_HOST,
   DB_USER,
   DB_PASSWORD,
   DB_NAME,
};

const missing = Object.entries(required)
   .filter(([, value]) => !value)
   .map(([name]) => name);

if (missing.length > 0) {
   console.error(
      `Variabili database mancanti: ${missing.join(", ")}`
   );
   process.exit(1);
}

// Costruiamo la connessione MariaDB.
// URL gestisce automaticamente i caratteri speciali.
const databaseUrl = new URL("mysql://localhost");

databaseUrl.hostname = DB_HOST;
databaseUrl.port = DB_PORT;
databaseUrl.username = DB_USER;
databaseUrl.password = DB_PASSWORD;
databaseUrl.pathname = `/${encodeURIComponent(DB_NAME)}`;

// Eseguibile dbmate installato nel progetto.
const dbmate = resolve("node_modules/.bin/dbmate");

if (!existsSync(dbmate)) {
   console.error(
      "dbmate non trovato. Esegui prima npm install."
   );
   process.exit(1);
}

// Passiamo le credenziali tramite variabili d'ambiente,
// senza mostrarle negli argomenti del comando.
const result = spawnSync(
   dbmate,
   [
      "--no-dump-schema",
      ...process.argv.slice(2),
   ],
   {
      stdio: "inherit",
      env: {
         ...process.env,
         DATABASE_URL: databaseUrl.toString(),
      },
   }
);

if (result.error) {
   console.error("Impossibile avviare dbmate:", result.error.message);
   process.exit(1);
}

process.exit(result.status ?? 1);
