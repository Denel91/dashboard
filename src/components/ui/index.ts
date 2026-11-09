// Componenti dell'interfaccia (linee guida iOS 27, sezioni 3 e 10).
// Le pagine importano solo da qui, mai da react-aria-components (D22):
// lo controlla la regola no-restricted-imports in eslint.config.mjs.

export {
  PulsantePrincipale,
  PulsanteSecondario,
  PulsanteTesto,
  PulsanteDistruttivo,
} from './pulsante';
export { PulsanteNuovaSpesa } from './pulsante-nuova-spesa';
export { BarraInBasso, SPAZIO_BARRA_IN_BASSO } from './barra-in-basso';
export { Card } from './card';
export { GruppoRighe, Riga } from './gruppo-righe';
export { Iniziale } from './iniziale';
export { Foglio, ApriFoglio } from './foglio';
export { RegioneAvvisi, mostraAvviso, chiudiAvviso, DURATA_AVVISO_MS } from './avviso';
