// Link d'invito (US-02, Progettazione sezione 6.4): il codice ha 32 caratteri
// esadecimali (128 bit casuali, generati dal database). Nell'app si mostra
// accorciato, per esempio …/invito/3f9c2a…

const FORMATO_CODICE = /^[0-9a-f]{32}$/;

/** Controlla il formato prima di chiedere al database: un codice storto è "Invito non valido". */
export function codiceInvitoValido(codice: string): boolean {
  return FORMATO_CODICE.test(codice);
}

export function linkInvito(origine: string, codice: string): string {
  return new URL(`/invito/${codice}`, origine).toString();
}

/** dashboard-denel.vercel.app/invito/3f9c2a… (senza https:// e con il codice accorciato). */
export function linkInvitoAccorciato(link: string): string {
  const url = new URL(link);
  const codice = url.pathname.split('/').pop() ?? '';
  return `${url.host}/invito/${codice.slice(0, 6)}…`;
}
