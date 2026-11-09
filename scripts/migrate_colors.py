#!/usr/bin/env python3

import argparse
import re
import shutil
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
CSS = SRC / "app" / "globals.css"

# Solo classi con almeno 5 occorrenze
# nell'inventario originale.
REPLACEMENTS = {
    "text-slate-400": "text-muted",
    "border-slate-600": "border-border-strong",
    "border-slate-700": "border-border",
    "text-sky-300": "text-primary",
    "text-slate-100": "text-foreground",
    "bg-slate-700": "bg-surface-raised",
    "text-slate-300": "text-muted-strong",
    "border-sky-400": "border-primary-hover",
    "bg-slate-900": "bg-surface-input",
    "border-sky-400/40": "border-primary-border",
    "bg-sky-400/10": "bg-primary-soft",
    "text-slate-500": "text-muted-subtle",
    "text-red-400": "text-danger",
    "ring-sky-400/30": "ring-primary-hover/30",
    "bg-sky-400/20": "bg-primary-hover/20",
    "text-slate-200": "text-text-on-surface",
}

# Ordine importante: prima le classi più specifiche.
OLD_CLASSES = sorted(REPLACEMENTS, key=len, reverse=True)

PATTERN = re.compile(
    r"(?<![\w-])(?:"
    + "|".join(re.escape(name) for name in OLD_CLASSES)
    + r")(?![\w/-])"
)


def transform(source):
    counts = Counter()

    def replace(match):
        old = match.group(0)
        counts[old] += 1
        return REPLACEMENTS[old]

    return PATTERN.sub(replace, source), counts


def update_css(source):
    if "--color-muted-subtle:" in source:
        return source

    root_anchor = "--muted: var(--color-slate-400);"
    theme_anchor = "--color-muted: var(--muted);"

    if root_anchor not in source or theme_anchor not in source:
        raise RuntimeError(
            "globals.css non contiene la palette prevista. "
            "Nessun file modificato."
        )

    source = source.replace(
        root_anchor,
        root_anchor
        + "\n  --muted-subtle: var(--color-slate-500);",
        1,
    )

    source = source.replace(
        theme_anchor,
        theme_anchor
        + "\n  --color-muted-subtle: var(--muted-subtle);",
        1,
    )

    return source


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if not CSS.is_file():
        raise RuntimeError(f"File non trovato: {CSS}")

    original_css = CSS.read_text(encoding="utf-8")
    updated_css = update_css(original_css)

    # Verifica che tutte le variabili necessarie
    # esistano nel tema CSS finale.
    for new_class in REPLACEMENTS.values():
        utility = new_class.split("/")[0]
        prefix, name = utility.split("-", 1)

        if prefix not in {"text", "bg", "border", "ring"}:
            continue

        if f"--color-{name}:" not in updated_css:
            raise RuntimeError(
                f"Variabile Tailwind mancante: --color-{name}"
            )

    changes = {}
    totals = Counter()

    for path in sorted(SRC.rglob("*")):
        if not path.is_file():
            continue

        if path.suffix not in {".ts", ".tsx"}:
            continue

        original = path.read_text(encoding="utf-8")
        updated, counts = transform(original)

        if updated != original:
            changes[path] = updated
            totals.update(counts)

    print("\n=== MIGRAZIONE COLORI ===")
    print("Modalita:", "ANTEPRIMA" if args.check else "APPLICAZIONE")
    print("File TS/TSX interessati:", len(changes))
    print("Sostituzioni totali:", sum(totals.values()))

    print("\nSostituzioni:")
    for old in OLD_CLASSES:
        count = totals[old]
        if count:
            print(
                f"  {count:3d}  {old}"
                f"  ->  {REPLACEMENTS[old]}"
            )

    print("\nFile interessati:")
    for path in changes:
        print(" ", path.relative_to(ROOT))

    if updated_css != original_css:
        print("\nAggiornamento previsto: src/app/globals.css")

    if args.check:
        print("\nANTEPRIMA COMPLETATA: nessun file modificato.")
        return

    if not changes and updated_css == original_css:
        print("\nNessuna modifica necessaria.")
        return

    backup = ROOT / ".color-backups" / datetime.now().strftime(
        "%Y%m%d-%H%M%S-%f"
    )

    # Salva tutti gli originali prima di modificare.
    for path in changes:
        destination = backup / path.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, destination)

    if updated_css != original_css:
        destination = backup / CSS.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(CSS, destination)

    # Applica le modifiche dopo il backup.
    for path, updated in changes.items():
        path.write_text(updated, encoding="utf-8")

    if updated_css != original_css:
        CSS.write_text(updated_css, encoding="utf-8")

    print("\nMODIFICHE APPLICATE.")
    print("Backup:", backup)


if __name__ == "__main__":
    main()
