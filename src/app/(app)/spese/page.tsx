import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ElencoSpese, type CategoriaInElenco } from '@/components/spese/elenco-spese';
import { hrefNuovaSpesa } from '@/components/ui';
import { limitiMese, meseDaParametro, meseVicino, nomeMese, oggiIso, type Mese } from '@/lib/date';
import { formattaEuro } from '@/lib/money';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { raggruppaPerGiorno, riepilogoMese, type SpesaInElenco } from '@/lib/spese/elenco';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Spese · Nucleo' };

// Spese (tavola 05, US-13): le spese di un mese, dalla più recente,
// raggruppate per giorno. Il mese sta nell'indirizzo (?mese=AAAA-MM), così
// il tasto Indietro e i link funzionano; i filtri per categoria e persona
// arrivano con US-41 (Sprint 7). Il Cestino ha la sua pagina (US-14).
export default function PaginaSpese({ searchParams }: PageProps<'/spese'>) {
  return (
    <main className="flex flex-col gap-6 py-2 lg:max-w-[680px]">
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
  const mese = meseDaParametro((await searchParams).mese, oggi);
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
    supabase.from('categorie').select('id, nome, icona, colore').eq('nucleo_id', nucleo.id),
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

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-titolo-grande font-bold">Spese</h1>
        <p className="text-sottotitolo text-testo-secondario">{nucleo.nome}</p>
      </header>

      <NavigazioneMese mese={mese} nome={nome} corrente={mese === oggi.slice(0, 7)} />

      {numero > 0 && (
        <p className="-mt-3 px-1 text-sottotitolo text-testo-secondario">
          {numero === 1 ? '1 spesa' : `${numero} spese`} ·{' '}
          <span className="importo text-testo">{formattaEuro(totaleCentesimi)}</span>
        </p>
      )}

      {giorni.length > 0 ? (
        <ElencoSpese giorni={giorni} categorie={perCategoria} membri={nucleo.membri} oggi={oggi} />
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
    </>
  );
}

const STILE_FRECCIA =
  'flex size-11 items-center justify-center rounded-capsula text-accento outline-hidden hover:bg-accento-tenue active:opacity-70 ' +
  'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento';

/** ‹ novembre › : il mese prima e dopo. Niente mesi nel futuro. */
function NavigazioneMese({ mese, nome, corrente }: { mese: Mese; nome: string; corrente: boolean }) {
  return (
    <nav aria-label="Mese" className="flex items-center gap-1">
      <Link href={`/spese?mese=${meseVicino(mese, -1)}`} aria-label="Mese prima" className={STILE_FRECCIA}>
        <ChevronLeft aria-hidden className="size-5" />
      </Link>
      <p aria-live="polite" className="min-w-36 text-center text-titolo-3 font-semibold first-letter:uppercase">
        {nome}
      </p>
      {corrente ? (
        <span aria-hidden className={STILE_FRECCIA + ' pointer-events-none opacity-30'}>
          <ChevronRight className="size-5" />
        </span>
      ) : (
        <Link href={`/spese?mese=${meseVicino(mese, 1)}`} aria-label="Mese dopo" className={STILE_FRECCIA}>
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      )}
    </nav>
  );
}
