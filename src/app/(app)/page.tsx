import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ArrowLeftRight, ArrowUpRight, ChevronRight, Inbox, Plus, ReceiptText, ShoppingCart, Wallet } from 'lucide-react';
import { registraRimborso } from '@/app/actions/rimborsi';
import { AzioneLink, Confronto, ContenutoAzione, Riquadro, UltimeSpese, stileAzione } from '@/components/home/riquadri';
import { CardSaldo } from '@/components/saldo/card-saldo';
import { CardSaldoComputer, stiliPulsantiCard } from '@/components/saldo/card-saldo-computer';
import { SegnaComeSaldato } from '@/components/saldo/segna-come-saldato';
import { IconaCategoria, Iniziale, hrefNuovaSpesa } from '@/components/ui';
import { dataEstesa, limitiMese, meseVicino, nomeMese, oggiIso, saluto, type Mese } from '@/lib/date';
import {
  frasePareggio,
  giornoCorto,
  giornoEMese,
  mediaAlGiorno,
  periodoPrecedente,
  quotePagate,
  serieDelMese,
  variazione,
} from '@/lib/home';
import { COLORE_DI_RISERVA } from '@/lib/categorie';
import { formattaEuro } from '@/lib/money';
import { leggiNucleoCorrente } from '@/lib/nucleo/corrente';
import { leggiStatoSaldo } from '@/lib/saldo/leggi';
import { riepilogoMese, type SpesaInElenco } from '@/lib/spese/elenco';
import { createClient } from '@/lib/supabase/server';

// Home (tavole 04, 15a e C1 v2, US-30): il saldo prima di tutto.
// - telefono e md (tavola 04): "Novembre" e il nucleo, a destra le
//   iniziali dei due, la card del saldo con "Vai al saldo ›" e il totale
//   del mese. Budget e grafici arrivano con US-44 e US-40;
// - da 1024 px (tavola C1 v2, D23): saluto e data; card protagonista del
//   saldo con l'anello "pagato da te", le spese dall'ultimo pareggio e i
//   numeri del mese; riquadri numerici con il mini grafico e il confronto
//   col mese prima; azioni rapide; ultime spese.
// Arrivano con le loro storie, nei posti della tavola: la card Budget
// accanto al saldo e "budget superato" (US-44), il riquadro Da riavere e
// l'azione "Segna come restituito" (US-25/26), l'azione Cestino (US-14),
// Cronologia ed Esporta i dati in alto (US-15, US-03), la card Per
// categoria accanto alle ultime spese (US-40), "N cose da guardare".
// Esci e l'account Google sono in Impostazioni (T-31).
export default function Home() {
  return (
    <main className="py-2">
      {/* Legge la sessione (cookie): con cacheComponents va dentro Suspense */}
      <Suspense fallback={<p className="text-testo-secondario">Caricamento…</p>}>
        <Contenuto />
      </Suspense>
    </main>
  );
}

async function Contenuto() {
  await connection();
  const nucleo = await leggiNucleoCorrente();
  if (!nucleo) redirect('/benvenuto');

  const adesso = new Date();
  const oggi = oggiIso(adesso);
  const mese = oggi.slice(0, 7) as Mese;
  const { inizio, fine } = limitiMese(mese);
  const supabase = await createClient();

  const giorno = Number(oggi.slice(8, 10));
  const mesePrima = meseVicino(mese, -1);
  const prima = periodoPrecedente(mesePrima, giorno);

  const [stato, spese, spesePrima, ultime, categorie, pareggio] = await Promise.all([
    leggiStatoSaldo(supabase, nucleo),
    supabase
      .from('spese')
      .select('importo_centesimi, terza_persona, pagata_da, data_spesa')
      .eq('nucleo_id', nucleo.id)
      .is('data_eliminazione', null)
      .gte('data_spesa', inizio)
      .lte('data_spesa', fine),
    // Stesso periodo del mese prima, per "↗ 6% su ottobre"
    supabase
      .from('spese')
      .select('importo_centesimi, terza_persona, pagata_da, data_spesa')
      .eq('nucleo_id', nucleo.id)
      .is('data_eliminazione', null)
      .gte('data_spesa', prima.inizio)
      .lte('data_spesa', prima.fine),
    supabase
      .from('spese')
      .select('id, importo_centesimi, descrizione, data_spesa, pagata_da, categoria_id, terza_persona')
      .eq('nucleo_id', nucleo.id)
      .is('data_eliminazione', null)
      .order('data_spesa', { ascending: false })
      .order('data_creazione', { ascending: false })
      .limit(4),
    supabase.from('categorie').select('id, nome, icona, colore').eq('nucleo_id', nucleo.id),
    // L'ultimo pareggio e le spese da allora, calcolati dal database (D26)
    supabase.rpc('ultimo_pareggio', { p_nucleo_id: nucleo.id }).single(),
  ]);
  for (const [cosa, r] of [
    ['spese', spese],
    ['spese del mese prima', spesePrima],
    ['ultime spese', ultime],
    ['categorie', categorie],
    ['ultimo pareggio', pareggio],
  ] as const) {
    if (r.error) {
      console.error(`[home] lettura di ${cosa} non riuscita`, r.error.code, r.error.message);
      throw new Error(`Lettura di ${cosa} non riuscita`);
    }
  }

  const delMese = spese.data ?? [];
  const { totaleCentesimi, numero } = riepilogoMese(delMese as SpesaInElenco[]);
  const totalePrima = riepilogoMese((spesePrima.data ?? []) as SpesaInElenco[]).totaleCentesimi;
  const nome = nomeMese(mese, oggi);
  const Nome = nome.charAt(0).toLocaleUpperCase('it-IT') + nome.slice(1);
  const nomePrima = nomeMese(mesePrima, oggi);

  const altra = nucleo.membri.find((m) => !m.sonoIo) ?? null;
  const quote = quotePagate(delMese, nucleo.io.id);
  const serie = serieDelMese(delMese, giorno);
  const media = mediaAlGiorno(totaleCentesimi, giorno);
  const oggiNumero = delMese.filter((s) => s.data_spesa === oggi && s.terza_persona === null).length;
  const conteggio = { mie: pareggio.data?.spese_mie ?? 0, altra: pareggio.data?.spese_altra ?? 0 };
  const giornoPareggio = pareggio.data?.data_pareggio ?? null;
  const frase = altra
    ? `${giornoPareggio ? `Dall’ultimo pareggio del ${giornoEMese(giornoPareggio, oggi)}` : 'Da quando avete iniziato'}: ${frasePareggio(conteggio, altra.nome)}.`
    : null;
  const perCategoria = new Map((categorie.data ?? []).map((c) => [c.id, c]));
  const perMembro = new Map(nucleo.membri.map((m) => [m.id, m]));
  const pulsanti = stiliPulsantiCard(stato);
  const vPrima = variazione(totaleCentesimi, totalePrima);
  const vMedia = variazione(media, mediaAlGiorno(totalePrima, Number(prima.fine.slice(8, 10))));

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-6">
      <header className="mb-2 flex items-start justify-between gap-4 lg:col-span-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-titolo-grande font-bold lg:hidden">{Nome}</h1>
          <h1 className="hidden text-titolo-1 font-bold lg:block">
            {saluto(adesso)}, {nucleo.io.nome}
          </h1>
          <p className="text-sottotitolo text-testo-secondario">
            <span className="lg:hidden">{nucleo.nome}</span>
            <span className="hidden lg:inline">{dataEstesa(oggi)}</span>
          </p>
        </div>
        {/* Le iniziali dei due (tavola 04); sul computer il profilo è nella barra laterale */}
        <p className="flex -space-x-1.5 lg:hidden" aria-label={nucleo.membri.map((m) => m.nome).join(' e ')}>
          {nucleo.membri.map((m) => (
            <span key={m.id} className="rounded-capsula ring-2 ring-sfondo">
              <Iniziale nome={m.nome} persona={m.persona} dimensione="piccola" decorativa />
            </span>
          ))}
        </p>
      </header>

      <div className="lg:hidden">
        <CardSaldo stato={stato} variante="home" titoloId="titolo-saldo">
          {stato.tipo === 'solo' ? (
            <Link href="/benvenuto/invita" className={STILE_LINK}>
              Invita l’altra persona
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          ) : (
            <Link href="/saldo" className={STILE_LINK}>
              Vai al saldo
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </CardSaldo>
      </div>

      {/* Da 1024 px la card protagonista (C1): fino al budget (US-44) prende tutta la riga */}
      <CardSaldoComputer
        className="hidden lg:col-span-12 lg:flex"
        stato={stato}
        io={nucleo.io}
        altra={altra}
        nomeMese={nome}
        pareggio={frase}
        totaleCentesimi={totaleCentesimi}
        numero={numero}
        quote={quote}
      >
        {stato.tipo === 'solo' ? (
          <Link href="/benvenuto/invita" className={pulsanti.pieno}>
            Invita l’altra persona
          </Link>
        ) : (
          <>
            {stato.tipo === 'debito' && altra && (
              <SegnaComeSaldato
                azione={registraRimborso}
                saldoCentesimi={stato.ioDevo ? -stato.importoCentesimi : stato.importoCentesimi}
                io={nucleo.io}
                altra={altra}
                pulsante={{ className: pulsanti.pieno, contenuto: 'Segna come saldato' }}
              />
            )}
            <Link href="/saldo" className={pulsanti.bordo}>
              Vai al saldo
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </>
        )}
      </CardSaldoComputer>

      <section aria-labelledby="titolo-totale" className="vetro-card flex flex-col gap-0.5 rounded-card p-4 lg:hidden">
        <h2 id="titolo-totale" className="text-sottotitolo text-testo-secondario">
          Totale di {nome}
        </h2>
        <p className="importo text-titolo-1 font-bold">{formattaEuro(totaleCentesimi)}</p>
        <p className="text-didascalia text-testo-secondario">Anticipi per terzi esclusi</p>
      </section>

      {/* Riquadri numerici (C1); il quarto, Da riavere, arriva con US-25 */}
      <div className="hidden gap-6 lg:col-span-12 lg:grid lg:grid-cols-3">
        <Riquadro
          icona={ReceiptText}
          pillola={vPrima !== null ? <Confronto punti={vPrima} mesePrima={nomePrima} /> : undefined}
          valore={formattaEuro(totaleCentesimi)}
          etichetta={`Totale di ${nome}`}
          serie={serie.totale}
        />
        <Riquadro
          icona={ShoppingCart}
          pillola={`oggi ${oggiNumero}`}
          valore={String(numero)}
          etichetta={`Spese a ${nome}`}
          serie={serie.numero}
        />
        <Riquadro
          icona={Wallet}
          pillola={vMedia !== null ? <Confronto punti={vMedia} mesePrima={nomePrima} /> : undefined}
          valore={formattaEuro(media)}
          etichetta="Media al giorno"
          serie={serie.media}
        />
      </div>

      {/* Azioni rapide (C1): Segna come restituito e Cestino arrivano con US-26 e US-14 */}
      <div className="hidden gap-6 lg:col-span-12 lg:grid lg:grid-cols-2 xl:grid-cols-4">
        <AzioneLink href={hrefNuovaSpesa('/')} icona={Plus} titolo="Nuova spesa" sotto="premi N" />
        {stato.tipo === 'debito' && altra && (
          <SegnaComeSaldato
            azione={registraRimborso}
            saldoCentesimi={stato.ioDevo ? -stato.importoCentesimi : stato.importoCentesimi}
            io={nucleo.io}
            altra={altra}
            pulsante={{
              className: stileAzione,
              contenuto: (
                <ContenutoAzione
                  icona={ArrowLeftRight}
                  titolo="Segna come saldato"
                  sotto={stato.ioDevo ? `Devi a ${altra.nome} ${formattaEuro(stato.importoCentesimi)}` : `${altra.nome} ti deve ${formattaEuro(stato.importoCentesimi)}`}
                />
              ),
            }}
          />
        )}
      </div>

      <div className="hidden lg:col-span-7 lg:block">
        <UltimeSpese vuota={(ultime.data ?? []).length === 0}>
          {(ultime.data ?? []).map((s, i) => {
            const categoria = s.categoria_id ? perCategoria.get(s.categoria_id) : undefined;
            const chi = perMembro.get(s.pagata_da);
            const sotto = s.terza_persona ? `anticipo per ${s.terza_persona}` : (chi?.nome ?? '');
            return (
              <li key={s.id}>
                <Link
                  href={`/spese?mese=${s.data_spesa.slice(0, 7)}&spesa=${s.id}`}
                  className={
                    'flex items-center gap-3 rounded-campo px-1 py-2.5 outline-hidden hover:bg-superficie-2 ' +
                    'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento ' +
                    (i > 0 ? 'border-t border-separatore' : '')
                  }
                >
                  <IconaCategoria icona={categoria?.icona ?? 'tag'} colore={categoria?.colore ?? COLORE_DI_RISERVA} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-corpo">{s.descrizione ?? categoria?.nome ?? 'Senza categoria'}</span>
                    <span className="truncate text-nota text-testo-secondario">
                      {giornoCorto(s.data_spesa, oggi)} · {sotto}
                    </span>
                  </span>
                  <span className="importo text-corpo">{formattaEuro(s.importo_centesimi)}</span>
                </Link>
              </li>
            );
          })}
        </UltimeSpese>
      </div>

      {numero === 0 && (
        // Stato vuoto (tavola 15a)
        <div className="flex flex-col items-center gap-4 py-10 text-center lg:hidden">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-capsula bg-superficie-2 text-testo-secondario">
            <Inbox className="size-6" />
          </span>
          <p className="text-corpo text-testo-secondario">Nessuna spesa a {nome}.</p>
          <Link
            href={hrefNuovaSpesa('/')}
            className={
              'flex h-12.5 items-center gap-2 rounded-capsula bg-accento px-6 text-intestazione text-su-accento ' +
              'shadow-lg shadow-accento/30 outline-hidden hover:brightness-110 active:scale-98 ' +
              'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-accento'
            }
          >
            <Plus aria-hidden="true" className="size-5" />
            Aggiungi la prima
          </Link>
        </div>
      )}
    </div>
  );
}

// "Vai al saldo ›" (tavola 04): link, perché porta a un'altra pagina (sezione 10.2).
// Il colore lo dà la card: testo-secondario, su-persona sulla card piena.
const STILE_LINK =
  '-ml-1 -mb-2 flex w-fit min-h-11 items-center gap-0.5 rounded-capsula px-1 text-sottotitolo outline-hidden ' +
  'hover:underline focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento';
