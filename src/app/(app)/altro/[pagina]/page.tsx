import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { IconaVoceAltro } from '@/components/altro/icona-voce';
import { PAGINE_ALTRO_IN_ARRIVO, paginaAltro } from '@/lib/altro';

// Le pagine di Altro che non ci sono ancora (T-31): Cronologia (US-15),
// Cestino (US-14), Da riavere (US-25/26), Categorie e budget (US-19, US-44).
// Dicono che arrivano e cosa succede già oggi ai loro dati, invece di un
// errore 404. Quando una pagina arriva, la sua cartella fissa
// (es. altro/cestino/) ha la precedenza su questa e la sostituisce.

export function generateStaticParams() {
  return PAGINE_ALTRO_IN_ARRIVO.map((p) => ({ pagina: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/altro/[pagina]'>): Promise<Metadata> {
  const pagina = paginaAltro((await params).pagina);
  return { title: `${pagina?.titolo ?? 'Altro'} · Nucleo` };
}

export default async function PaginaInArrivo({ params }: PageProps<'/altro/[pagina]'>) {
  const pagina = paginaAltro((await params).pagina);
  if (!pagina) notFound();

  return (
    <main className="flex w-full max-w-colonna flex-col gap-6 py-2">
      <Link
        href="/altro"
        className={
          '-ml-2 flex w-fit min-h-11 items-center gap-0.5 rounded-capsula pr-3 pl-1 text-corpo text-accento outline-hidden ' +
          'hover:bg-accento-tenue focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accento md:hidden'
        }
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
        Altro
      </Link>
      <header>
        <h1 className="text-titolo-grande font-bold">{pagina.titolo}</h1>
      </header>
      {/* Stato vuoto (sezione 3): testo centrato in testo-secondario */}
      <section className="flex flex-col items-center gap-3 py-12 text-center">
        <IconaVoceAltro voce={pagina.slug} colore={pagina.colore} />
        <p className="text-intestazione text-testo">Questa pagina arriva con un prossimo aggiornamento.</p>
        <p className="max-w-sm text-sottotitolo text-testo-secondario">{pagina.inAttesa}</p>
      </section>
    </main>
  );
}
