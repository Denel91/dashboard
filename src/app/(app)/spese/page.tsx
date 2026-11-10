import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { eliminaSpesa, modificaSpesa } from '@/app/actions/spese';
import { EliminaSpesa } from '@/components/spese/elimina-spesa';
import { ElencoSpese, type CategoriaInElenco } from '@/components/spese/elenco-spese';
import { ModuloSpesa } from '@/components/spese/modulo-spesa';
import { SceltaMese } from '@/components/spese/scelta-mese';
import { hrefNuovaSpesa } from '@/components/ui';
import { dataEOra, limitiMese, meseDaParametro, meseEAnno, mesiFinoA, nomeMese, oggiIso, type Mese } from '@/lib/date';
import { formattaEuro } from '@/lib/money';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { raggruppaPerGiorno, riepilogoMese, type SpesaInElenco } from '@/lib/spese/elenco';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Spese · Nucleo' };

// Spese (tavole 05, 07 e C2, US-13): le spese di un mese, dalla più
// recente, raggruppate per giorno. Mese e spesa aperta stanno
// nell'indirizzo (?mese=AAAA-MM&spesa=<id>), così il tasto Indietro e i link
// funzionano a ogni larghezza:
// - da 1024 px Modifica spesa sta accanto all'elenco (lista e dettaglio
//   affiancati, D21, tavola C2);
// - sotto, la spesa aperta copre l'elenco a tutto schermo, come una
//   schermata modale (tavola 07); ✕, Esc e Indietro tornano all'elenco.
// I filtri per categoria e persona arrivano con US-41 (Sprint 7).
export default function PaginaSpese({ searchParams }: PageProps<'/spese'>) {
  return (
    <main className="py-2">
      <Suspense fallback={<p className="text-testo-secondario">Caricamento…</p>}>
        <Contenuto searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Contenuto({ searchParams }: Pick<PageProps<'/spese'>, 'searchParams'>) {
  await connection();
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  const oggi = oggiIso(new Date());
  const parametri = await searchParams;
  const mese = meseDaParametro(parametri.mese, oggi);
  const idScelta = typeof parametri.spesa === 'string' && RE_UUID.test(parametri.spesa) ? parametri.spesa : null;
  const indirizzoElenco = `/spese?mese=${mese}`;
  const { inizio, fine } = limitiMese(mese);

  const supabase = await createClient();
  const [spese, categorie] = await Promise.all([
    supabase
      .from('spese')
      .select(
        'id, importo_centesimi, divisione, descrizione, data_spesa, pagata_da, categoria_id, terza_persona, valuta, importo_originale',
      )
      .eq('nucleo_id', nucleo.id)
      .is('data_eliminazione', null)
      .gte('data_spesa', inizio)
      .lte('data_spesa', fine)
      .order('data_spesa', { ascending: false })
      .order('data_creazione', { ascending: false }),
    // Anche le archiviate: una spesa vecchia può averne una
    supabase.from('categorie').select('id, nome, icona, colore, ordine, data_archiviazione').eq('nucleo_id', nucleo.id).order('ordine'),
  ]);
  for (const [cosa, r] of [['spese', spese], ['categorie', categorie]] as const) {
    if (r.error) {
      console.error(`[spese] lettura di ${cosa} non riuscita`, r.error.code, r.error.message);
      throw new Error(`Lettura di ${cosa} non riuscita`);
    }
  }

  const elenco = (spese.data ?? []) as SpesaInElenco[];
  const giorni = raggruppaPerGiorno(elenco);
  const { totaleCentesimi, numero } = riepilogoMese(elenco);
  const perCategoria = new Map<string, CategoriaInElenco>((categorie.data ?? []).map((c) => [c.id, c]));
  const nome = nomeMese(mese, oggi);

  const dettaglio = idScelta ? await leggiSpesa(supabase, nucleo.id, idScelta) : null;

  const colonnaElenco = (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-titolo-grande font-bold">Spese</h1>
        <p className="text-sottotitolo text-testo-secondario">{nucleo.nome}</p>
      </header>

      <SceltaMese mese={mese} mesi={scelteMese(mese, oggi)} />

      {numero > 0 && (
        <p className="-mt-3 px-1 text-nota text-testo-secondario">
          <span className="sr-only">Totale {formattaEuro(totaleCentesimi)}. </span>
          {numero === 1 ? '1 spesa' : `${numero} spese`} · {meseEAnno(mese)} · i totali del giorno escludono gli anticipi per
          terzi
        </p>
      )}

      {giorni.length > 0 ? (
        <ElencoSpese
          giorni={giorni}
          categorie={perCategoria}
          membri={nucleo.membri}
          oggi={oggi}
          hrefSpesa={(id) => `${indirizzoElenco}&spesa=${id}`}
          scelta={idScelta ?? undefined}
        />
      ) : (
        // Stato vuoto (tavola 15a): un messaggio e un'azione, mai una pagina vuota
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-corpo text-testo-secondario">Nessuna spesa a {nome}.</p>
          <Link
            href={hrefNuovaSpesa('/spese')}
            className="rounded-capsula px-3 py-2 text-corpo text-accento outline-hidden hover:bg-accento-tenue focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento"
          >
            Aggiungi la prima
          </Link>
        </div>
      )}
    </div>
  );

  // Categorie per il modulo: quelle attive, più quella della spesa se è archiviata
  const perModulo = (categorie.data ?? [])
    .filter((c) => !c.data_archiviazione || c.id === dettaglio?.categoria_id)
    .map(({ id, nome, icona }) => ({ id, nome, icona }));
  const autore = dettaglio && nucleo.membri.find((m) => m.id === dettaglio.autore);

  return (
    <div className="lg:grid lg:grid-cols-[420px_1fr] lg:items-start lg:gap-6">
      {/* Sotto 1024 px, con una spesa aperta l'elenco resta sotto, coperto */}
      <div className={idScelta ? 'hidden lg:block' : undefined}>{colonnaElenco}</div>

      {idScelta ? (
        <section
          aria-label="Modifica spesa"
          className={
            'fixed inset-0 z-50 overflow-y-auto bg-superficie ' +
            'lg:sticky lg:top-8 lg:z-auto lg:max-h-[calc(100dvh-4rem)] lg:rounded-card lg:shadow-lg'
          }
        >
          {dettaglio ? (
            <ModuloSpesa
              // Dopo "Ricarica" (F3) i valori sono nuovi: il modulo riparte da capo
              key={`${dettaglio.id}-${dettaglio.data_modifica}`}
              azione={modificaSpesa}
              titolo="Modifica spesa"
              membri={nucleo.membri}
              io={nucleo.io}
              categorie={perModulo}
              oggi={oggi}
              dopo={indirizzoElenco}
              nascosti={{ id: dettaglio.id, data_modifica: dettaglio.data_modifica }}
              iniziale={{
                importoCentesimi: dettaglio.importo_centesimi,
                pagataDa: dettaglio.pagata_da,
                perAltraPersona: dettaglio.divisione === 'per_altra_persona',
                categoriaId: dettaglio.categoria_id,
                dataSpesa: dettaglio.data_spesa,
                descrizione: dettaglio.descrizione,
                metodoPagamento: METODI.find((m) => m === dettaglio.metodo_pagamento) ?? 'carta',
                note: dettaglio.note,
              }}
              eliminazione={
                <EliminaSpesa
                  elimina={eliminaSpesa.bind(null, dettaglio.id)}
                  dopo={indirizzoElenco}
                  riassunto={`${dettaglio.descrizione ?? perCategoria.get(dettaglio.categoria_id ?? '')?.nome ?? 'Senza categoria'} · ${formattaEuro(dettaglio.importo_centesimi)}`}
                />
              }
              dettagli={`Creata ${autore ? `da ${autore.sonoIo ? 'te' : autore.nome} ` : ''}il ${dataEOra(dettaglio.data_creazione)}`}
            />
          ) : (
            <SpesaNonTrovata dopo={indirizzoElenco} />
          )}
        </section>
      ) : (
        <div className="vetro-card hidden min-h-80 items-center justify-center rounded-card p-8 text-center lg:sticky lg:top-8 lg:flex">
          <p className="text-corpo text-testo-secondario">Scegli una spesa per vederne i dettagli</p>
        </div>
      )}
    </div>
  );
}

const METODI = ['carta', 'contanti', 'bonifico'] as const;

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** La spesa da modificare, se esiste ed è del nucleo (lo garantisce anche la RLS). */
async function leggiSpesa(supabase: Supabase, nucleoId: string, id: string) {
  const { data, error } = await supabase
    .from('spese')
    .select(
      'id, importo_centesimi, divisione, descrizione, data_spesa, pagata_da, categoria_id, metodo_pagamento, note, autore, data_creazione, data_modifica',
    )
    .eq('id', id)
    .eq('nucleo_id', nucleoId)
    .is('data_eliminazione', null)
    .maybeSingle();
  if (error) {
    console.error('[spese] lettura della spesa non riuscita', error.code, error.message);
    throw new Error('Lettura della spesa non riuscita');
  }
  return data;
}

/** La spesa nel link non c'è più (eliminata dall'altra persona, o un link vecchio). */
function SpesaNonTrovata({ dopo }: { dopo: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center lg:min-h-80">
      <p className="text-corpo text-testo">Questa spesa non c’è più.</p>
      <p className="text-sottotitolo text-testo-secondario">Forse è stata spostata nel Cestino.</p>
      <Link
        href={dopo}
        replace
        className="rounded-capsula px-3 py-2 text-corpo text-accento outline-hidden hover:bg-accento-tenue focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento"
      >
        Torna alle spese
      </Link>
    </div>
  );
}

/** Mesi della tendina: gli ultimi 24, più quello dell'indirizzo se è più vecchio. */
function scelteMese(mese: Mese, oggi: string) {
  const mesi = mesiFinoA(oggi.slice(0, 7) as Mese, 24);
  if (!mesi.includes(mese)) mesi.push(mese);
  return mesi.map((m) => ({ valore: m, nome: nomeMese(m, oggi) }));
}
