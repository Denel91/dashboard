#!/usr/bin/env bash
# Crea label, milestone (sprint e versioni) e issue del backlog
# "Dashboard finanziaria di coppia" nel repository GitHub corrente.
#
# Uso (dalla cartella del repository, con `gh auth login` già fatto):
#   DRY_RUN=1 ./crea-backlog.sh   # mostra cosa farebbe, senza toccare GitHub
#   ./crea-backlog.sh             # crea davvero
#
# Si può rilanciare: label aggiornate, milestone e issue già esistenti saltate.

set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    local line="$*"
    echo "[dry-run] ${line:0:160}" >&2
  else
    "$@"
  fi
}

if [[ "$DRY_RUN" != "1" ]]; then
  command -v gh >/dev/null || { echo "Serve GitHub CLI (gh)."; exit 1; }
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
else
  REPO="owner/dashboard-coppia"
fi
echo "Repository: $REPO"

# ---------- Label ----------
while IFS='|' read -r name color desc; do
  [[ -z "$name" ]] && continue
  run gh label create "$name" --color "$color" --description "$desc" --force
done <<'EOF'
story|1D76DB|User story dal REQUIREMENTS.md
task|5319E7|Attività tecnica
must|B60205|Priorità MoSCoW: Must
should|FBCA04|Priorità MoSCoW: Should
could|C2E0C6|Priorità MoSCoW: Could
area:infra|BFD4F2|Strumenti, CI, deploy
area:db|D4C5F9|Schema, RLS, trigger, viste
area:auth|F9D0C4|Accesso e nucleo di coppia
area:spese|C5DEF5|Inserimento e gestione spese
area:saldo|BFDADC|Saldo e rimborsi
area:dashboard|FEF2C0|Grafici, filtri, budget
EOF

# ---------- Milestone ----------
# titolo|scadenza (vuota per le versioni future)|descrizione
existing_milestones=""
if [[ "$DRY_RUN" != "1" ]]; then
  existing_milestones="$(gh api "repos/$REPO/milestones?state=all&per_page=100" -q '.[].title')"
fi

while IFS='|' read -r title due desc; do
  [[ -z "$title" ]] && continue
  if grep -Fxq "$title" <<<"$existing_milestones"; then
    echo "Milestone già presente: $title"; continue
  fi
  args=(gh api "repos/$REPO/milestones" -f "title=$title" -f "description=$desc")
  [[ -n "$due" ]] && args+=(-f "due_on=${due}T23:59:59Z")
  run "${args[@]}" >/dev/null
done <<'EOF'
Sprint 0|2026-11-08|Fase 2: strumenti e ambiente pronti
Sprint 1|2026-11-29|Fondamenta del database: schema, RLS, calcoli in centesimi, storico
Sprint 2|2026-12-13|Accesso e nucleo di coppia
Sprint 3|2026-12-27|Inserimento e gestione delle spese
Sprint 4|2027-01-10|Saldo, rimborsi e Release 0.1 in produzione
Sprint 5|2027-01-24|Cestino, Cronologia e casi particolari delle spese
Sprint 6|2027-02-07|Categorie, anticipi per terzi, tempo reale, export
Sprint 7|2027-02-21|Dashboard e filtri
Sprint 8|2027-03-07|Budget e cancellazione account: MVP completo
v1.1||Offline, ricorrenti, categoria suggerita, link di pagamento
v1.2||Foto scontrino, riepilogo mensile
v2.0.0||Notifiche push
EOF

# ---------- Issue ----------
# titolo|label (separate da virgola)|milestone|ore stimate|fatto quando
existing_issues=""
if [[ "$DRY_RUN" != "1" ]]; then
  existing_issues="$(gh issue list --state all --limit 500 --json title -q '.[].title')"
fi

count=0
while IFS='|' read -r title labels milestone hours done_when; do
  [[ -z "$title" || "$title" == \#* ]] && continue
  if grep -Fxq "$title" <<<"$existing_issues"; then
    echo "Issue già presente: $title"; continue
  fi
  body="**Stima:** ${hours} h

**Fatto quando:** ${done_when}

**Definition of Done:** test verdi in CI · RLS attiva e testata sulle tabelle nuove · migrazione versionata in \`supabase/migrations\` · provato da telefono sul link di preview Vercel · PR collegata a questa issue.

Riferimento: \`REQUIREMENTS.md\` v1.4."
  run gh issue create --title "$title" --label "$labels" --milestone "$milestone" --body "$body" >/dev/null
  count=$((count + 1))
done <<'EOF'
# --- Sprint 0 (Fase 2) ---
T-01 Repository GitHub, protezione di main e 2FA|task,must,area:infra|Sprint 0|1|Repository privato creato, main accetta solo PR, 2FA attiva su GitHub, Vercel e Supabase (NF-08)
T-02 Progetto Supabase "staging" in UE e Supabase locale|task,must,area:infra|Sprint 0|1|Progetto creato a Francoforte (NF-07); `npx supabase start` funziona in locale con Docker
T-03 Scaffold Next.js 16 con Tailwind v4 e Vitest|task,must,area:infra|Sprint 0|1.5|`npm run dev`, `npm run lint` e `npm test` partono senza errori
T-04 Vercel collegato al repository|task,must,area:infra|Sprint 0|0.5|Ogni PR genera un link di preview collegato a Supabase staging
T-05 CI con GitHub Actions: lint, type-check, test|task,must,area:infra|Sprint 0|1|Una PR con un errore di tipo o un test rosso non si può unire
T-06 Board GitHub Projects e backlog|task,must,area:infra|Sprint 0|1|Board con colonne Backlog, Da fare, In corso, Fatto e tutte le issue caricate
# --- Sprint 1 ---
T-10 Migrazione 1: schema core e policy RLS|task,must,area:db|Sprint 1|5|Tabelle households, household_members, categories, expenses, settlements, expense_history, category_budgets con RLS e funzione is_member
T-11 Test pgTAP delle policy RLS|task,must,area:db|Sprint 1|2|Due membri leggono e scrivono, un terzo account non legge né modifica nulla (NF-05)
T-12 lib/money.ts con test (R2, R3, R4, R7)|task,must,area:spese|Sprint 1|3|Divisione 50/50 e 100/0 in centesimi; 10,01 € → l'altra persona deve 5,00 €; importi negativi coperti; formato 1.234,56 €
T-13 Trigger dello storico su spese e rimborsi (US-15, parte DB)|task,must,area:db|Sprint 1|2|Creazione, modifica, eliminazione e ripristino scrivono una riga in expense_history con valori prima/dopo
# --- Sprint 2 ---
US-01 Accesso con Google|story,must,area:auth|Sprint 2|3|Client OAuth in Google Cloud (solo email e profilo, app pubblicata), provider attivo in Supabase, "Continua con Google" funziona da telefono e computer; proxy.ts protegge /dashboard; provider email di Supabase disattivato
US-02 Creazione del nucleo e invito del partner con un link|story,must,area:auth|Sprint 2|5|Il partner entra aprendo solo il link; il link non funziona per una terza persona a nucleo completo
T-20 Keep-alive: cron Vercel giornaliero con query al database|task,must,area:infra|Sprint 2|1|Una route protetta da CRON_SECRET esegue una query; il progetto non va in pausa (NF-11)
T-21 Categorie predefinite dalle spese reali (US-19, seed)|task,must,area:spese|Sprint 2|1|Un nuovo nucleo nasce con le categorie ricavate dai 2–3 mesi di spese reali
# --- Sprint 3 ---
US-10 · US-11 · US-12 Aggiunta rapida di una spesa|story,must,area:spese|Sprint 3|7|Importo primo campo, valori predefiniti, interruttore "per l'altra persona"; salvataggio in meno di 10 secondi da telefono
US-13 Elenco, modifica ed eliminazione delle spese|story,must,area:spese|Sprint 3|4|Elenco per giorno; il salvataggio fallisce se l'altra persona ha modificato la stessa spesa (NF-06)
# --- Sprint 4 ---
US-30 Saldo "chi deve quanto a chi"|story,must,area:saldo|Sprint 4|4|Vista SQL balances; il saldo coincide al centesimo con un calcolo manuale
US-31 · US-32 · US-33 Segna come saldato, rimborso parziale, annulla rimborso|story,must,area:saldo|Sprint 4|4|Un tocco azzera il saldo; importo modificabile; annullamento tracciato nello storico
T-30 Setup produzione e Release 0.1|task,must,area:infra|Sprint 4|3|Progetto Supabase prod in UE, client OAuth Google configurato con gli URL di produzione, Security Advisor pulito, primo backup, accesso provato dai due telefoni
# --- Sprint 5 ---
US-14 Cestino con recupero entro 30 giorni|story,must,area:spese|Sprint 5|3|Le spese eliminate non contano nel saldo e si ripristinano dal Cestino
US-15 Schermata Cronologia|story,must,area:spese|Sprint 5|3|Ogni evento dello storico è visibile a entrambi con chi, cosa, quando, prima e dopo
US-16 Avviso di possibile doppione|story,must,area:spese|Sprint 5|1.5|Stesso importo e stessa data: avviso, ma il salvataggio resta possibile
US-17 Spesa in valuta estera|story,must,area:spese|Sprint 5|2.5|Dati importo originale e tasso o importo in euro, l'app calcola il valore mancante
US-18 Resi e rimborsi del negozio (importi negativi)|story,must,area:spese|Sprint 5|1|Un importo negativo si divide con le stesse regole
# --- Sprint 6 ---
US-19 Gestione delle categorie|story,must,area:spese|Sprint 6|3|Aggiungere, rinominare e archiviare categorie con icona e colore
US-25 · US-26 Anticipi per terzi e "Da riavere"|story,must,area:spese|Sprint 6|3|Gli anticipi non toccano il saldo di coppia; segnati come restituiti escono dall'elenco
US-34 Aggiornamento in tempo reale|story,must,area:saldo|Sprint 6|2|Una spesa inserita su un telefono compare sull'altro entro pochi secondi
US-03 Esportazione completa dei dati|story,must,area:auth|Sprint 6|3|CSV/JSON con spese, rimborsi, categorie e storico, apribile in un foglio di calcolo
# --- Sprint 7 ---
US-40 Dashboard: totale, categorie, andamento|story,must,area:dashboard|Sprint 7|6|Numero grande, torta per categoria, barre per mese; anticipi per terzi esclusi
US-41 Filtri per mese, categoria e persona|story,must,area:dashboard|Sprint 7|3|I filtri vivono nella query string
T-40 Stati vuoti, caricamento ed errori|task,must,area:dashboard|Sprint 7|3|Ogni schermata ha skeleton, stato vuoto e messaggio d'errore
# --- Sprint 8 ---
US-44 Budget mensile per categoria|story,must,area:dashboard|Sprint 8|5|Barra speso/budget; avviso all'80% e al 100%; modifiche valide dal mese corrente
US-04 Cancellazione dell'account|story,must,area:auth|Sprint 8|4|Avviso se il saldo non è a zero; le spese restano all'altra persona come "Ex membro"
# --- Versioni successive ---
US-20 Categoria suggerita dallo storico|story,should,area:spese|v1.1|2|Una descrizione già usata propone l'ultima categoria abbinata
US-35 Link di pagamento nel pareggio|story,should,area:saldo|v1.1|2|Ogni persona salva il proprio link, visibile nella schermata del saldo
US-42 Spese ricorrenti|story,should,area:spese|v1.1|6|La spesa viene creata alla data prevista e si può modificare o saltare
US-43 Inserimento senza rete|story,should,area:spese|v1.1|10|Le spese restano in coda e si sincronizzano senza doppioni
US-45 Foto dello scontrino|story,could,area:spese|v1.2|4|Foto allegata alla spesa
US-46 Riepilogo del mese in CSV o PDF|story,could,area:dashboard|v1.2|4|Riepilogo diverso dall'export completo di US-03
US-47 Notifiche push per le spese importanti|story,could,area:spese|v2.0.0|8|Soglia e attivazione nelle impostazioni
EOF

echo "Issue create in questa esecuzione: $count"
echo "Per aggiungerle alla board: gh project item-add <numero-progetto> --owner <utente> --url <url-issue>"
echo "oppure attiva il flusso automatico \"Auto-add to project\" nelle impostazioni della board."
