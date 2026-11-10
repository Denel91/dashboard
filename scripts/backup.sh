#!/usr/bin/env bash
# Backup del database di produzione (NF-11, rischio K7, T-30).
# Supabase Free non fa backup automatici: questa è l'unica copia.
# Da lanciare una volta al mese, e prima di ogni migrazione in produzione.
#
# Uso (Git Bash, con Docker Desktop acceso):
#   NUCLEO_DB_URL='postgresql://postgres.<id>:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres' \
#     ./scripts/backup.sh
#
# NUCLEO_DB_URL: Supabase → progetto di produzione → Connect → Session pooler.
# Non scriverla mai in un file del repository. La cartella dei backup sta
# FUORI dal repository (il repo è pubblico, D4): di default ~/Backup/nucleo.
set -euo pipefail

: "${NUCLEO_DB_URL:?Manca NUCLEO_DB_URL (Supabase → Connect → Session pooler)}"
CARTELLA="${NUCLEO_BACKUP_DIR:-$HOME/Backup/nucleo}/$(date +%Y-%m-%d)"

case "$CARTELLA" in
  "$(git rev-parse --show-toplevel 2>/dev/null || echo /nessun-repo)"*)
    echo "La cartella dei backup non può stare dentro il repository: è pubblico." >&2
    exit 1 ;;
esac

mkdir -p "$CARTELLA"
echo "Backup in $CARTELLA"
pnpm exec supabase db dump --remote="$NUCLEO_DB_URL" -f "$CARTELLA/ruoli.sql" --role-only
pnpm exec supabase db dump --remote="$NUCLEO_DB_URL" -f "$CARTELLA/schema.sql"
pnpm exec supabase db dump --remote="$NUCLEO_DB_URL" -f "$CARTELLA/dati.sql" --use-copy --data-only

# Controllo minimo: i tre file esistono e quello dei dati contiene le spese
for f in ruoli schema dati; do test -s "$CARTELLA/$f.sql" || { echo "File vuoto: $f.sql" >&2; exit 1; }; done
grep -qiE 'copy "?public"?."?spese"?' "$CARTELLA/dati.sql" || { echo "Nel backup mancano le spese" >&2; exit 1; }
echo "Fatto: $(du -sh "$CARTELLA" | cut -f1). Copialo anche fuori dal computer (chiavetta o cloud personale)."
