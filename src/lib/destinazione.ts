/**
 * Dove mandare l'utente dopo l'accesso (parametro ?next=).
 * Accetta solo percorsi interni all'app: un link come
 * /accesso?next=https://sito-falso.it non deve portare fuori (open redirect).
 */
export function destinazioneSicura(next: string | null | undefined): string {
  if (!next) return '/';
  // Deve iniziare con una sola barra: "//sito.it" e "/\sito.it" sono indirizzi esterni
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  // Tornare alla pagina di accesso dopo l'accesso non ha senso
  if (next === '/accesso' || next.startsWith('/accesso?') || next.startsWith('/auth/')) return '/';
  return next;
}
