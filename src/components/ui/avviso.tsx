'use client';

import { X } from 'lucide-react';
import {
  Button,
  Text,
  // In react-aria-components 1.22.1 il Toast è ancora sperimentale: il
  // prefisso UNSTABLE_ resta chiuso in questo file (linee guida, sezione 10.3).
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion,
} from 'react-aria-components';

// Avvisi della pagina (linee guida sezione 3, tavole 19b F7, 19c F2, 20):
// barra scura `avviso` in basso, sopra la barra di navigazione, con ✕.
// Scompare da sola dopo 4 secondi (il tempo si ferma col dito o il mouse
// sopra, o col focus) ed è annunciata ai lettori di schermo. Non imita le
// notifiche di iOS (D13).

export type ContenutoAvviso = { testo: string };

/** Durata predefinita di un avviso, in millisecondi. */
export const DURATA_AVVISO_MS = 4000;

// Una sola coda per tutta l'app: un avviso alla volta, il successivo aspetta.
export const codaAvvisi = new ToastQueue<ContenutoAvviso>({ maxVisibleToasts: 1 });

/**
 * Mostra un avviso, per esempio dopo il salvataggio di una spesa (F7):
 * mostraAvviso('Spesa salvata · Simona ti deve 47,05 €')
 * Restituisce la chiave, che serve solo per chiuderlo prima con chiudiAvviso().
 */
export function mostraAvviso(testo: string, { durata = DURATA_AVVISO_MS }: { durata?: number } = {}) {
  return codaAvvisi.add({ testo }, { timeout: durata });
}

export function chiudiAvviso(chiave: string) {
  codaAvvisi.close(chiave);
}

/**
 * Il punto della pagina in cui compaiono gli avvisi: va messo una volta sola,
 * nel layout delle pagine dell'app.
 */
export function RegioneAvvisi() {
  return (
    <ToastRegion
      queue={codaAvvisi}
      aria-label="Avvisi"
      className={
        'pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 outline-hidden ' +
        // Telefono: sopra la barra in basso (60 px di barra + 12 di margine + 16 di respiro).
        // Da 768 px: in basso al centro dell'area del contenuto, accanto alla barra laterale (sezione 9.4).
        'bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:left-22 lg:left-[292px]'
      }
    >
      {({ toast }) => (
        <Toast
          toast={toast}
          className={
            'pointer-events-auto flex w-full max-w-md items-center md:max-w-[420px] gap-1 rounded-card bg-avviso py-1 pr-1 pl-4 ' +
            'text-su-avviso shadow-lg outline-hidden transition duration-200 ease-out ' +
            'starting:translate-y-2 starting:opacity-0 motion-reduce:starting:translate-y-0 ' +
            'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-offset-2 data-focus-visible:outline-accento'
          }
        >
          <ToastContent className="min-w-0 flex-1 py-2.5">
            <Text slot="title" className="text-sottotitolo">
              {toast.content.testo}
            </Text>
          </ToastContent>
          <Button
            slot="close"
            aria-label="Chiudi"
            className={
              'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-capsula outline-hidden ' +
              'data-hovered:opacity-80 data-pressed:opacity-60 ' +
              'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-su-avviso'
            }
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </Toast>
      )}
    </ToastRegion>
  );
}
