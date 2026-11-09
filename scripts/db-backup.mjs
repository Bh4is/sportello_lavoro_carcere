
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

const {
   DB_HOST,
   DB_PORT = "3306",
   DB_USER,
   DB_PASSWORD,
   DB_NAME,
} = process.env;

if (
   !DB_HOST ||
   !DB_USER ||
   DB_PASSWORD === undefined ||
   !DB_NAME
) {
   console.error("Configurazione MariaDB incompleta.");
   process.exit(1);
}

if (
   !/^[a-zA-Z0-9_]+$/.test(DB_NAME) ||
   !/^\d+$/.test(DB_PORT)
) {
   console.error("Nome del database o porta non validi.");
   process.exit(1);
}

const backupDir = join(
   homedir(),
   ".local",
   "share",
   "sportello-lavoro-carcere",
   "backups"
);

const timestamp = new Date()
   .toISOString()
   .replace(/[:.]/g, "-");

const filename = `${DB_NAME}-${timestamp}.sql.gz`;
const backupPath = join(backupDir, filename);

await mkdir(backupDir, {
   recursive: true,
   mode: 0o700,
});

console.log(`Backup database: ${DB_NAME}`);
console.log(`Destinazione: ${backupPath}`);

const dump = spawn(
   "mariadb-dump",
   [
      "--protocol=tcp",
      `--host=${DB_HOST}`,
      `--port=${DB_PORT}`,
      `--user=${DB_USER}`,
      "--single-transaction",
      "--quick",
      "--routines",
      "--triggers",
      "--events",
      "--databases",
      DB_NAME,
   ],
   {
      stdio: ["ignore", "pipe", "inherit"],
      env: {
         ...process.env,
         MYSQL_PWD: DB_PASSWORD,
      },
   }
);

const processResult = new Promise((resolve, reject) => {
   dump.on("error", reject);

   dump.on("close", (code) => {
      if (code === 0) {
         resolve();
      } else {
         reject(
            new Error(`mariadb-dump terminato con codice ${code}`)
         );
      }
   });
});

try {
   await Promise.all([
      pipeline(
         dump.stdout,
         createGzip(),
         createWriteStream(backupPath, {
            flags: "wx",
            mode: 0o600,
         })
      ),
      processResult,
   ]);

   console.log("Backup completato correttamente.");
} catch (error) {
   dump.kill();

   await rm(backupPath, { force: true });

   console.error("Backup fallito:", error.message);
   process.exitCode = 1;
}
