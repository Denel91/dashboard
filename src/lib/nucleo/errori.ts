// Messaggi in italiano per gli errori delle funzioni del database
// crea_nucleo() ed entra_nel_nucleo() (Progettazione, sezioni 4.2 e 6.4,
// tavola 16). I codici li alza il database: l'app li traduce e basta.

export type CodiceErroreNucleo = 'P0001' | 'P0002' | 'P0003';

export type ErroreNucleo = { titolo: string; testo: string };

export function erroreNucleo(codice: CodiceErroreNucleo, nomeNucleo?: string | null): ErroreNucleo {
  switch (codice) {
    case 'P0001':
      return {
        titolo: 'Il nucleo è già completo',
        testo: `${nomeNucleo ? nomeNucleo : 'Questo nucleo'} ha già due persone.`,
      };
    case 'P0002':
      return {
        titolo: 'Invito non valido',
        testo: 'Questo link non è più valido. Chiedi a chi ti ha invitato il link aggiornato: lo trova in Impostazioni.',
      };
    case 'P0003':
      return {
        titolo: 'Fai già parte di un nucleo',
        testo: 'Fai già parte di un nucleo con questo account Google. Controlla di aver scelto l’account giusto.',
      };
  }
}

/** Riconosce i codici P0001–P0003 in un errore restituito da Supabase. */
export function codiceErroreNucleo(errore: { code?: string } | null | undefined): CodiceErroreNucleo | null {
  const codice = errore?.code;
  return codice === 'P0001' || codice === 'P0002' || codice === 'P0003' ? codice : null;
}
