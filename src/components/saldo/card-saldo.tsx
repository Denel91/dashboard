import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Iniziale } from '@/components/ui';
import { formattaEuro } from '@/lib/money';
import type { Membro } from '@/lib/nucleo/corrente';
import type { StatoSaldo } from '@/lib/saldo/saldo';

// Card del saldo (US-30, linee guida sezioni 3 e 9.8):
// - `home` (tavole 04 e 15a): allineata a sinistra, iniziale e frase in
//   alto, importo grande, sotto "Vai al saldo ›" (lo passa la pagina);
// - `pagina` (tavola 08a): al centro, chi deve → chi riceve, frase e importo.
// Sul telefono è tenue nel colore di chi deve (D17) con un bordo leggero
// dello stesso colore; da 1024 px è la card protagonista piena (D23), con il
// testo sempre `su-persona` pieno e un anello `su-persona` sulle iniziali.
// In pari o da soli è una card neutra.
// Il colore non è mai l'unico segnale: ci sono sempre nomi e iniziali (NF-09).

const PIENA = {
  a: 'border-persona-a/25 bg-persona-a-tenue lg:border-transparent lg:bg-persona-a lg:text-su-persona',
  b: 'border-persona-b/25 bg-persona-b-tenue lg:border-transparent lg:bg-persona-b lg:text-su-persona',
} as const;

const NOME = { a: 'text-persona-a lg:text-su-persona', b: 'text-persona-b lg:text-su-persona' } as const;

export function CardSaldo({
  stato,
  variante,
  titoloId,
  children,
}: {
  stato: StatoSaldo;
  variante: 'home' | 'pagina';
  /** id del testo che dà il nome alla card (aria-labelledby della sezione). */
  titoloId?: string;
  /** Sotto l'importo: "Vai al saldo ›" nella Home, "Segna come saldato" nel Saldo. */
  children?: ReactNode;
}) {
  const centro = variante === 'pagina';
  const sfondo = stato.tipo === 'debito' ? `border ${PIENA[stato.debitore.persona]}` : 'vetro-card';

  return (
    <section
      aria-labelledby={titoloId}
      className={`flex flex-col gap-1 rounded-card p-4 ${centro ? 'items-center py-6 text-center' : ''} ${sfondo}`}
    >
      {stato.tipo === 'debito' ? (
        <>
          {centro ? (
            <p className="mb-2 flex items-center gap-2" aria-hidden="true">
              <InizialeCard membro={stato.debitore} dimensione="grande" />
              <ArrowRight className="size-5 opacity-60" />
              <InizialeCard membro={stato.creditore} dimensione="grande" />
            </p>
          ) : null}
          <p id={titoloId} className={`flex items-center gap-2 ${centro ? 'text-corpo' : 'text-richiamo font-semibold'}`}>
            {!centro && <InizialeCard membro={stato.debitore} dimensione="piccola" />}
            <Frase stato={stato} centro={centro} />
          </p>
          <p className="importo text-importo font-bold">{formattaEuro(stato.importoCentesimi)}</p>
        </>
      ) : stato.tipo === 'pari' ? (
        <>
          <p id={titoloId} className="flex items-center gap-2 text-sottotitolo text-testo-secondario">
            <span className="flex -space-x-1.5" aria-hidden="true">
              {stato.membri.map((m) => (
                <span key={m.id} className="rounded-capsula ring-2 ring-superficie">
                  <Iniziale nome={m.nome} persona={m.persona} dimensione="piccola" decorativa />
                </span>
              ))}
            </span>
            {stato.membri[0].nome} e {stato.membri[1].nome}
          </p>
          <p className="text-titolo-1 font-bold">Siete in pari</p>
        </>
      ) : (
        <>
          <p id={titoloId} className="text-titolo-3 font-bold">
            Sei ancora da solo
          </p>
          <p className="text-sottotitolo text-testo-secondario">Il saldo compare quando l’altra persona entra nel nucleo.</p>
        </>
      )}
      {children && (
        <div
          className={
            `mt-1 flex flex-col gap-2 text-testo-secondario ${centro ? 'w-full items-center' : ''} ` +
            (stato.tipo === 'debito' ? 'lg:text-su-persona' : '')
          }
        >
          {children}
        </div>
      )}
    </section>
  );
}

function Frase({ stato, centro }: { stato: Extract<StatoSaldo, { tipo: 'debito' }>; centro: boolean }) {
  const nome = (m: Membro) => <strong className={`font-semibold ${NOME[m.persona]}`}>{m.nome}</strong>;
  // Nella Home tutta la frase è nel colore di chi deve (tavola 04); nel Saldo
  // solo il nome (tavola 08a)
  if (!centro) {
    const colore = NOME[stato.debitore.persona];
    return <span className={colore}>{stato.ioDevo ? `Devi a ${stato.creditore.nome}` : `${stato.debitore.nome} ti deve`}</span>;
  }
  return stato.ioDevo ? (
    <span>
      Devi a {nome(stato.creditore)}
    </span>
  ) : (
    <span>
      {nome(stato.debitore)} ti deve
    </span>
  );
}

/** Iniziale con l'anello `su-persona` sulla card piena (sezione 9.8), sennò quella del colore della card sparisce. */
function InizialeCard({ membro, dimensione }: { membro: Membro; dimensione: 'piccola' | 'grande' }) {
  return (
    <span className="rounded-capsula lg:ring-2 lg:ring-su-persona">
      <Iniziale nome={membro.nome} persona={membro.persona} dimensione={dimensione} decorativa />
    </span>
  );
}
