// Iniziale della persona (linee guida sezione 3, D17, NF-09): cerchio pieno
// `persona-a` (Daniele) o `persona-b` (Simona) con l'iniziale in
// `su-persona`. Il colore non è mai l'unico segnale: c'è sempre la lettera, e
// per i lettori di schermo il nome intero.

type Persona = 'a' | 'b';

const COLORE: Record<Persona, string> = {
  a: 'bg-persona-a',
  b: 'bg-persona-b',
};

const DIMENSIONE = {
  piccola: 'size-6 text-didascalia-2', // 24 px, accanto agli importi nelle righe
  media: 'size-8 text-nota', // 32 px, nelle righe e nelle card
  grande: 'size-11 text-intestazione', // 44 px, profilo e saldo
} as const;

/** Prima lettera del nome, maiuscola; "?" se il nome è vuoto. */
export function inizialeDi(nome: string) {
  const lettera = Array.from(nome.trim())[0];
  return lettera ? lettera.toLocaleUpperCase('it-IT') : '?';
}

export function Iniziale({
  nome,
  persona,
  dimensione = 'media',
  decorativa = false,
}: {
  nome: string;
  persona: Persona;
  dimensione?: keyof typeof DIMENSIONE;
  /** true quando il nome è già scritto accanto: i lettori di schermo la saltano. */
  decorativa?: boolean;
}) {
  return (
    <span
      role={decorativa ? undefined : 'img'}
      aria-label={decorativa ? undefined : nome}
      aria-hidden={decorativa || undefined}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-capsula font-semibold text-su-persona ${COLORE[persona]} ${DIMENSIONE[dimensione]}`}
    >
      {inizialeDi(nome)}
    </span>
  );
}
