// Date di calendario (AAAA-MM-GG) nel fuso italiano.
// Non sta in un file "use client": la usano anche il server e le Server
// Actions, e una funzione esportata da un Client Component, sul server,
// diventa un riferimento invece della funzione (Fase 3, sezione 5, regola 8).

export const FUSO_ORARIO = 'Europe/Rome';

/**
 * Data di oggi come AAAA-MM-GG nel fuso indicato (predefinito: Italia).
 * A mezzanotte e mezza in Italia il server in UTC è ancora a ieri: per
 * questo il fuso è esplicito.
 */
export function oggiIso(adesso: Date, fuso = FUSO_ORARIO) {
  // en-CA scrive le date proprio come AAAA-MM-GG
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(adesso);
}
