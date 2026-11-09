
#!/usr/bin/env bash

set -euo pipefail

# Sportello Lavoro Carcere
# Aggiornamento Git + migrazioni MariaDB

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

echo "========================================"
echo " Sportello Lavoro Carcere"
echo " Aggiornamento applicazione e database"
echo "========================================"

# 1. Verifica modifiche locali ai file tracciati

echo
echo "[1/5] Controllo repository Git..."

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERRORE: sono presenti modifiche locali non salvate su Git."
    echo "Esegui commit o stash prima dell'aggiornamento."
    exit 1
fi

# 2. Aggiorna il codice

echo
echo "[2/5] Aggiornamento codice..."

git pull --ff-only

# 3. Verifica prerequisiti

if [[ ! -f ".env.local" ]]; then
    echo "ERRORE: file .env.local mancante."
    exit 1
fi

if [[ ! -x "node_modules/.bin/dbmate" ]]; then
    echo "ERRORE: dbmate non installato."
    echo "Esegui: npm ci --include=dev"
    exit 1
fi

# 4. Controlla le migrazioni

echo
echo "[3/5] Controllo migrazioni MariaDB..."

STATUS="$(npm run db:status)"

echo "$STATUS"

# Non eseguire la baseline su un database
# di cui non conosciamo ancora la struttura.

if grep -Fq "[ ] 20261109000000_baseline.sql" <<< "$STATUS"; then
    echo
    echo "ERRORE: baseline non inizializzata."
    echo "Verificare lo schema prima di applicare le migrazioni."
    exit 1
fi

# Nessuna migrazione in sospeso.

if ! grep -Eq '^\[ \] ' <<< "$STATUS"; then
    echo
    echo "Il database e' gia' aggiornato."
    echo "Aggiornamento completato."
    exit 0
fi

# 5. Backup prima delle migrazioni

echo
echo "[4/5] Backup preventivo MariaDB..."

node --env-file=.env.local scripts/db-backup.mjs

# Il comando precedente deve terminare
# correttamente prima di proseguire.

echo
echo "[5/5] Applicazione migrazioni..."

npm run db:migrate

echo
echo "Verifica finale..."

FINAL_STATUS="$(npm run db:status)"

echo "$FINAL_STATUS"

if grep -Eq '^\[ \] ' <<< "$FINAL_STATUS"; then
    echo "ERRORE: risultano migrazioni ancora da applicare."
    exit 1
fi

echo
echo "========================================"
echo " Aggiornamento completato correttamente!"
echo "========================================"
