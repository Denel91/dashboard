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
